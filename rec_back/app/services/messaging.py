# app/services/messaging.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime, timedelta

from app.models.messaging import (
    Conversation, Message, MessageAttachment, MessageReadReceipt,
    MessageReaction, EmailTemplate, ConversationType, MessageType, MessageStatus
)
from app.models.user import User
from app.schemas.messaging import (
    ConversationCreate, MessageCreate, SendMessageRequest,
    CreateConversationRequest, EmailTemplateCreate
)
from app.crud import messaging as messaging_crud
from app.services.base import BaseService


class MessagingService(BaseService[Conversation, messaging_crud.CRUDConversation]):
    """Service for messaging and communication operations"""
    
    def __init__(self):
        super().__init__(messaging_crud.conversation)
        self.message_crud = messaging_crud.message
        self.attachment_crud = messaging_crud.message_attachment
        self.template_crud = messaging_crud.email_template
    
    def create_conversation(
        self, 
        db: Session, 
        *, 
        request: CreateConversationRequest,
        created_by: UUID
    ) -> Conversation:
        """Create a new conversation with participants"""
        # Validate participants exist
        participants = db.query(User).filter(
            User.id.in_(request.participant_ids + [created_by])
        ).all()
        
        if len(participants) != len(request.participant_ids) + 1:
            raise ValueError("One or more participants not found")
        
        # Create conversation
        conversation = self.crud.create_direct_conversation(
            db,
            user1_id=created_by,
            user2_id=request.participant_ids[0] if len(request.participant_ids) == 1 else None,
            title=request.title
        )
        
        # Add additional participants for group conversations
        if len(request.participant_ids) > 1:
            conversation.type = ConversationType.GROUP
            for participant_id in request.participant_ids[1:]:
                self.crud.add_participant(
                    db, 
                    conversation_id=conversation.id,
                    user_id=participant_id
                )
        
        # Send initial message if provided
        if request.initial_message:
            self.send_message(
                db,
                conversation_id=conversation.id,
                sender_id=created_by,
                message_data=SendMessageRequest(content=request.initial_message)
            )
        
        db.commit()
        return conversation
    
    def send_message(
        self, 
        db: Session, 
        *, 
        conversation_id: UUID,
        sender_id: UUID,
        message_data: SendMessageRequest
    ) -> Message:
        """Send a message in a conversation"""
        # Validate conversation and sender
        conversation = self.crud.get(db, id=conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")
        
        # Check if sender is participant
        if not self._is_participant(db, conversation_id, sender_id):
            raise ValueError("User is not a participant in this conversation")
        
        # Create message
        message_create = MessageCreate(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=message_data.content,
            message_type=message_data.message_type,
            reply_to_id=message_data.reply_to_id,
            mentions=message_data.mentions
        )
        
        message = self.message_crud.create_message(db, message_data=message_create)
        
        # Handle attachments
        if message_data.attachment_urls:
            for url in message_data.attachment_urls:
                self._create_attachment_from_url(db, message.id, url)
        
        # Send notifications to participants
        self._notify_participants(db, conversation, message, sender_id)
        
        # Handle mentions
        if message_data.mentions:
            self._notify_mentions(db, message, message_data.mentions)
        
        return message
    
    def mark_messages_as_read(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        message_ids: List[UUID]
    ) -> int:
        """Mark multiple messages as read"""
        marked_count = 0
        
        for message_id in message_ids:
            success = self.message_crud.mark_as_read(
                db, 
                message_id=message_id,
                user_id=user_id
            )
            if success:
                marked_count += 1
        
        return marked_count
    
    def add_reaction(
        self, 
        db: Session, 
        *, 
        message_id: UUID,
        user_id: UUID,
        emoji: str
    ) -> bool:
        """Add reaction to a message"""
        # Validate message exists and user has access
        message = self.message_crud.get(db, id=message_id)
        if not message:
            return False
        
        if not self._is_participant(db, message.conversation_id, user_id):
            return False
        
        return self.message_crud.add_reaction(
            db,
            message_id=message_id,
            user_id=user_id,
            emoji=emoji
        )
    
    def get_unread_count(
        self, 
        db: Session, 
        *, 
        user_id: UUID
    ) -> Dict[str, int]:
        """Get unread message counts for user"""
        conversations = self.crud.get_user_conversations(db, user_id=user_id)
        
        total_unread = 0
        unread_by_conversation = {}
        
        for conv in conversations:
            # Get unread messages in conversation
            unread = db.query(func.count(Message.id)).filter(
                and_(
                    Message.conversation_id == conv.id,
                    Message.sender_id != user_id,
                    ~Message.id.in_(
                        db.query(MessageReadReceipt.message_id).filter(
                            MessageReadReceipt.user_id == user_id
                        )
                    )
                )
            ).scalar()
            
            if unread > 0:
                unread_by_conversation[str(conv.id)] = unread
                total_unread += unread
        
        return {
            "total": total_unread,
            "by_conversation": unread_by_conversation
        }
    
    def create_email_template(
        self, 
        db: Session, 
        *, 
        template_data: EmailTemplateCreate,
        created_by: UUID
    ) -> EmailTemplate:
        """Create a new email template"""
        # Check if template with same name exists
        existing = db.query(EmailTemplate).filter(
            EmailTemplate.name == template_data.name
        ).first()
        
        if existing:
            raise ValueError("Template with this name already exists")
        
        # Parse and validate template variables
        variables = self._extract_template_variables(template_data.body)
        template_data.variables = variables
        
        # Create template
        template = self.template_crud.create(db, obj_in=template_data)
        
        return template
    
    def render_email_template(
        self, 
        db: Session, 
        *, 
        template_id: UUID,
        context: Dict[str, Any]
    ) -> Dict[str, str]:
        """Render email template with context"""
        template = self.template_crud.get(db, id=template_id)
        if not template:
            raise ValueError("Template not found")
        
        # Validate required variables
        if template.required_variables:
            missing = [
                var for var in template.required_variables 
                if var not in context
            ]
            if missing:
                raise ValueError(f"Missing required variables: {missing}")
        
        # Render template
        rendered_subject = self._render_template_string(template.subject, context)
        rendered_body = self._render_template_string(template.body, context)
        
        # Increment usage count
        self.template_crud.increment_usage(db, template_id=template_id)
        
        return {
            "subject": rendered_subject,
            "body": rendered_body,
            "template_used": str(template_id)
        }
    
    def get_conversation_summary(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        days: int = 7
    ) -> Dict[str, Any]:
        """Get conversation activity summary for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        conversations = self.crud.get_user_conversations(db, user_id=user_id)
        
        summary = {
            "total_conversations": len(conversations),
            "active_conversations": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "most_active_conversation": None,
            "recent_conversations": []
        }
        
        conversation_activity = {}
        
        for conv in conversations:
            # Get messages in time period
            messages = db.query(Message).filter(
                and_(
                    Message.conversation_id == conv.id,
                    Message.created_at >= since_date
                )
            ).all()
            
            if messages:
                summary["active_conversations"] += 1
                conversation_activity[conv.id] = len(messages)
                
                # Count sent/received
                for msg in messages:
                    if msg.sender_id == user_id:
                        summary["messages_sent"] += 1
                    else:
                        summary["messages_received"] += 1
                
                # Add to recent if has activity
                summary["recent_conversations"].append({
                    "id": conv.id,
                    "title": conv.title or self._get_conversation_title(db, conv, user_id),
                    "last_message": messages[-1].created_at,
                    "message_count": len(messages),
                    "unread": self._get_unread_count_for_conversation(
                        db, conv.id, user_id
                    )
                })
        
        # Sort recent by last message
        summary["recent_conversations"].sort(
            key=lambda x: x["last_message"], 
            reverse=True
        )
        summary["recent_conversations"] = summary["recent_conversations"][:10]
        
        # Find most active
        if conversation_activity:
            most_active_id = max(
                conversation_activity.items(), 
                key=lambda x: x[1]
            )[0]
            most_active = next(
                c for c in conversations if c.id == most_active_id
            )
            summary["most_active_conversation"] = {
                "id": most_active.id,
                "title": most_active.title or self._get_conversation_title(
                    db, most_active, user_id
                ),
                "message_count": conversation_activity[most_active_id]
            }
        
        return summary
    
    def search_messages(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        query: str,
        conversation_id: Optional[UUID] = None,
        limit: int = 50
    ) -> List[Message]:
        """Search messages accessible to user"""
        # Get user's conversations
        user_conversations = self.crud.get_user_conversations(db, user_id=user_id)
        conversation_ids = [c.id for c in user_conversations]
        
        if conversation_id:
            if conversation_id not in conversation_ids:
                return []
            conversation_ids = [conversation_id]
        
        # Search messages
        search_term = f"%{query}%"
        messages = db.query(Message).filter(
            and_(
                Message.conversation_id.in_(conversation_ids),
                Message.content.ilike(search_term)
            )
        ).order_by(
            desc(Message.created_at)
        ).limit(limit).all()
        
        return messages
    
    def archive_conversation(
        self, 
        db: Session, 
        *, 
        conversation_id: UUID,
        user_id: UUID
    ) -> bool:
        """Archive a conversation for user"""
        # Validate user is participant
        if not self._is_participant(db, conversation_id, user_id):
            return False
        
        conversation = self.crud.get(db, id=conversation_id)
        if conversation:
            conversation.is_archived = True
            db.commit()
            return True
        
        return False
    
    def get_email_template_analytics(
        self, 
        db: Session, 
        *, 
        template_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get email template usage analytics"""
        if template_id:
            templates = [self.template_crud.get(db, id=template_id)]
        else:
            templates = self.template_crud.get_multi(db, limit=1000)
        
        analytics = {
            "total_templates": len(templates),
            "total_usage": sum(t.usage_count or 0 for t in templates),
            "templates": []
        }
        
        for template in templates:
            analytics["templates"].append({
                "id": template.id,
                "name": template.name,
                "type": template.template_type,
                "usage_count": template.usage_count or 0,
                "last_used": template.last_used_at,
                "is_default": template.is_default,
                "effectiveness": self._calculate_template_effectiveness(
                    db, template
                )
            })
        
        # Sort by usage
        analytics["templates"].sort(
            key=lambda x: x["usage_count"], 
            reverse=True
        )
        
        return analytics
    
    def _is_participant(
        self, 
        db: Session, 
        conversation_id: UUID, 
        user_id: UUID
    ) -> bool:
        """Check if user is participant in conversation"""
        from app.models.messaging import conversation_participants
        
        participant = db.query(conversation_participants).filter(
            and_(
                conversation_participants.c.conversation_id == conversation_id,
                conversation_participants.c.user_id == user_id,
                conversation_participants.c.left_at.is_(None)
            )
        ).first()
        
        return participant is not None
    
    def _create_attachment_from_url(
        self, 
        db: Session, 
        message_id: UUID, 
        url: str
    ):
        """Create attachment record from URL"""
        # Parse file info from URL (simplified)
        file_name = url.split('/')[-1]
        
        attachment = MessageAttachment(
            message_id=message_id,
            file_url=url,
            file_name=file_name,
            file_type=self._get_file_type_from_name(file_name)
        )
        db.add(attachment)
    
    def _get_file_type_from_name(self, file_name: str) -> str:
        """Determine file type from name"""
        extension = file_name.split('.')[-1].lower() if '.' in file_name else ''
        
        file_types = {
            'pdf': 'document',
            'doc': 'document',
            'docx': 'document',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'mp4': 'video',
            'mp3': 'audio'
        }
        
        return file_types.get(extension, 'other')
    
    def _notify_participants(
        self, 
        db: Session, 
        conversation: Conversation,
        message: Message,
        sender_id: UUID
    ):
        """Notify conversation participants of new message"""
        # Get participants except sender
        from app.models.messaging import conversation_participants
        
        participants = db.query(conversation_participants).filter(
            and_(
                conversation_participants.c.conversation_id == conversation.id,
                conversation_participants.c.user_id != sender_id,
                conversation_participants.c.left_at.is_(None)
            )
        ).all()
        
        # Queue notifications
        for participant in participants:
            # This would integrate with notification service
            pass
    
    def _notify_mentions(
        self, 
        db: Session, 
        message: Message,
        mentioned_user_ids: List[UUID]
    ):
        """Notify users who were mentioned"""
        for user_id in mentioned_user_ids:
            # This would integrate with notification service
            pass
    
    def _extract_template_variables(self, template_body: str) -> List[str]:
        """Extract variable placeholders from template"""
        import re
        
        # Find {{variable}} patterns
        pattern = r'\{\{(\w+)\}\}'
        variables = re.findall(pattern, template_body)
        
        return list(set(variables))
    
    def _render_template_string(
        self, 
        template_str: str, 
        context: Dict[str, Any]
    ) -> str:
        """Render template string with context"""
        import re
        
        def replace_var(match):
            var_name = match.group(1)
            return str(context.get(var_name, f"{{{{{var_name}}}}}"))
        
        pattern = r'\{\{(\w+)\}\}'
        return re.sub(pattern, replace_var, template_str)
    
    def _get_conversation_title(
        self, 
        db: Session, 
        conversation: Conversation,
        for_user_id: UUID
    ) -> str:
        """Generate conversation title for user"""
        if conversation.title:
            return conversation.title
        
        # For direct conversations, use other participant's name
        if conversation.type == ConversationType.DIRECT:
            from app.models.messaging import conversation_participants
            
            other_participant = db.query(User).join(
                conversation_participants,
                conversation_participants.c.user_id == User.id
            ).filter(
                and_(
                    conversation_participants.c.conversation_id == conversation.id,
                    conversation_participants.c.user_id != for_user_id
                )
            ).first()
            
            if other_participant:
                return other_participant.full_name
        
        return "Conversation"
    
    def _get_unread_count_for_conversation(
        self, 
        db: Session, 
        conversation_id: UUID,
        user_id: UUID
    ) -> int:
        """Get unread count for specific conversation"""
        return db.query(func.count(Message.id)).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                ~Message.id.in_(
                    db.query(MessageReadReceipt.message_id).filter(
                        MessageReadReceipt.user_id == user_id
                    )
                )
            )
        ).scalar() or 0
    
    def _calculate_template_effectiveness(
        self, 
        db: Session, 
        template: EmailTemplate
    ) -> Dict[str, Any]:
        """Calculate template effectiveness metrics"""
        # This would track email opens, clicks, responses
        # For now, return placeholder data
        return {
            "open_rate": 65.5,
            "click_rate": 12.3,
            "response_rate": 8.7
        }


# Create service instance
messaging_service = MessagingService()