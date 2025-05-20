from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID, uuid4
import json
import os
from pathlib import Path

# Load fake data
current_dir = Path(__file__).parent.parent.parent.parent
fake_conversations_path = current_dir / "fake_data" / "conversations.json"
fake_messages_path = current_dir / "fake_data" / "messages.json"

# Load conversations
with open(fake_conversations_path, "r") as f:
    FAKE_CONVERSATIONS = json.load(f)

# Load messages
with open(fake_messages_path, "r") as f:
    FAKE_MESSAGES = json.load(f)

# Helper to convert conversation from DB format to API format
def format_conversation(conv: Dict[str, Any], include_is_starred: bool = True, include_has_attachments: bool = True) -> Dict[str, Any]:
    # Get participants
    participants = []
    for p in conv["participants"]:
        # Find user in some fake user data to get more info
        # In a real implementation, this would query the database
        participant = {
            "id": str(p["user_id"]),
            "type": p["role"],  # admin, member, etc.
            "name": f"User {p['user_id']}",  # Would be fetched from users table
            "avatar": None  # Would be fetched from users table
        }
        participants.append(participant)
    
    # Find last message
    last_message = None
    messages_for_conv = [m for m in FAKE_MESSAGES if m["conversation_id"] == conv["id"]]
    if messages_for_conv:
        # Sort by created_at to find the newest
        last_msg = sorted(messages_for_conv, key=lambda x: x["created_at"], reverse=True)[0]
        sender_name = f"User {last_msg['sender_id']}"  # Would be fetched from users table
        
        last_message = {
            "content": last_msg["content"],
            "sender": sender_name,
            "timestamp": last_msg["created_at"],
            "status": last_msg["status"]
        }
    
    # Get unread count (messages where status is not "read")
    unread_count = sum(1 for m in messages_for_conv if m["status"] != "read")
    
    # Format response
    response = {
        "id": str(conv["id"]),
        "title": conv["title"],
        "participants": participants,
        "type": "group" if conv["is_group"] else "individual",
        "last_message": last_message,
        "unread_count": unread_count,
        "created_at": conv["created_at"],
        "updated_at": conv["updated_at"],
        "associated_entities": []
    }
    
    # Add optional fields used by the frontend
    if include_is_starred:
        response["is_starred"] = False  # This would be user-specific in a real implementation
    
    if include_has_attachments:
        # Check if any messages in this conversation have attachments
        has_attachments = any(len(m.get("attachments", [])) > 0 for m in messages_for_conv)
        response["has_attachments"] = has_attachments
    
    return response

# Helper to convert message from DB format to API format
def format_message(msg: Dict[str, Any]) -> Dict[str, Any]:
    # Find sender and format
    sender = {
        "id": str(msg["sender_id"]),
        "type": "admin",  # Would be determined from DB
        "name": f"User {msg['sender_id']}",  # Would be fetched from users table
        "avatar": None  # Would be fetched from users table
    }
    
    # Format recipients
    recipients = []
    # In a real implementation, we'd query the recipients table
    # For now, we'll create dummy recipients
    
    # Format attachments
    attachments = []
    for attachment in msg.get("attachments", []):
        attachments.append({
            "id": str(attachment.get("id")),
            "name": attachment.get("file_name", ""),
            "file_type": attachment.get("file_type", "application/octet-stream"),
            "file_size": attachment.get("file_size", 0),
            "url": f"/api/v1/attachments/{attachment.get('id')}",
            "storage_path": attachment.get("storage_path", ""),
            # Add these required fields
            "type": "file",  # Default to 'file' or derive from file_type
            "size": attachment.get("file_size", 0)  # Use the same value as file_size
        })
    
    # Format entity references
    entity_references = []
    for entity in msg.get("entity_references", []):
        entity_references.append({
            "type": entity.get("type"),
            "id": str(entity.get("id")),
            "name": entity.get("name", "")
        })
    
    return {
        "id": str(msg["id"]),
        "conversation_id": str(msg["conversation_id"]),
        "content": msg["content"],
        "sender": sender,
        "recipients": recipients,  # Would be populated from DB
        "attachments": attachments,
        "entity_references": entity_references,
        "status": msg["status"],
        "created_at": msg["created_at"],
        "updated_at": msg.get("updated_at", msg["created_at"]),
        "type": msg.get("type", "text"),
        "template_id": msg.get("template_id"),
        # Add the required priority field
        "priority": msg.get("priority", "normal")  # Default to 'normal'
    }
# Models for messaging
class ParticipantBase(BaseModel):
    id: str
    type: str  # 'admin', 'candidate', 'employer', 'consultant', 'system'
    name: str
    avatar: Optional[str] = None

class EntityReferenceBase(BaseModel):
    type: str  # 'job', 'application', 'company', 'candidate'
    id: str
    name: str

class AttachmentBase(BaseModel):
    id: str
    type: str  # 'file', 'image', 'document'
    name: str
    url: str
    size: int
    mime_type: Optional[str] = None

class MessageCreate(BaseModel):
    content: str
    sender: ParticipantBase
    recipients: List[ParticipantBase]
    attachments: Optional[List[AttachmentBase]] = None
    referenced_entities: Optional[List[EntityReferenceBase]] = None
    scheduled_for: Optional[datetime] = None
    priority: str = "normal"  # 'normal', 'urgent'

class MessageUpdate(BaseModel):
    status: Optional[str] = None  # 'draft', 'sending', 'sent', 'delivered', 'read', 'failed'
    flags: Optional[List[str]] = None  # 'flagged', 'followup', 'archived'

class Message(BaseModel):
    id: str
    conversation_id: str
    content: str
    sender: ParticipantBase
    recipients: List[ParticipantBase]
    attachments: Optional[List[AttachmentBase]] = None
    referenced_entities: Optional[List[EntityReferenceBase]] = None
    status: str  # 'draft', 'sending', 'sent', 'delivered', 'read', 'failed'
    created_at: datetime
    scheduled_for: Optional[datetime] = None
    priority: str  # 'normal', 'urgent'
    flags: Optional[List[str]] = None  # 'flagged', 'followup', 'archived'

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    participants: List[ParticipantBase]
    type: str  # 'individual', 'group'
    associated_entities: Optional[List[EntityReferenceBase]] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    participants: Optional[List[ParticipantBase]] = None
    associated_entities: Optional[List[EntityReferenceBase]] = None

class LastMessage(BaseModel):
    content: str
    sender: str
    timestamp: datetime
    status: str  # 'sent', 'delivered', 'read', 'failed'

class Conversation(BaseModel):
    id: str
    title: Optional[str] = None
    participants: List[ParticipantBase]
    type: str  # 'individual', 'group'
    last_message: Optional[LastMessage] = None
    unread_count: int
    created_at: datetime
    updated_at: datetime
    associated_entities: Optional[List[EntityReferenceBase]] = None

class MessageTemplateCreate(BaseModel):
    name: str
    content: str
    category: str
    variables: Optional[List[str]] = None

class MessageTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    variables: Optional[List[str]] = None

class MessageTemplate(BaseModel):
    id: str
    name: str
    content: str
    category: str
    variables: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

class NotificationPreferencesUpdate(BaseModel):
    in_app: Optional[bool] = None
    email: Optional[bool] = None
    email_digest: Optional[str] = None  # 'never', 'daily', 'weekly'
    sms: Optional[bool] = None
    do_not_disturb_start: Optional[str] = None  # HH:MM format
    do_not_disturb_end: Optional[str] = None  # HH:MM format

class NotificationPreferences(BaseModel):
    user_id: str
    in_app: bool = True
    email: bool = True
    email_digest: str = "never"  # 'never', 'daily', 'weekly'
    sms: bool = False
    do_not_disturb_start: Optional[str] = None  # HH:MM format
    do_not_disturb_end: Optional[str] = None  # HH:MM format

class MarkMessagesReadRequest(BaseModel):
    message_ids: List[str]

# Create router
router = APIRouter()

# Conversations endpoints
@router.get("/conversations", response_model=List[Conversation])
async def get_conversations(
    user_id: str,
    skip: int = 0, 
    limit: int = 100,
    unread_only: bool = False,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None
):
    """
    Get conversations for the current user, with optional filtering.
    
    - user_id: ID of the current user
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return (pagination)
    - unread_only: If true, only return conversations with unread messages
    - entity_type: Filter by associated entity type (e.g., 'job', 'candidate')
    - entity_id: Filter by associated entity ID
    """
    # Filter conversations where the user is a participant
    user_conversations = []
    for conv in FAKE_CONVERSATIONS:
        # Check if user is a participant
        is_participant = any(p["user_id"] == int(user_id) for p in conv["participants"])
        if not is_participant:
            continue
            
        # Apply entity type filter if specified
        if entity_type and conv.get("entity_type") != entity_type:
            continue
            
        # Apply entity ID filter if specified
        if entity_id and str(conv.get("entity_id")) != entity_id:
            continue
            
        # Apply unread filter if specified
        if unread_only:
            messages_for_conv = [m for m in FAKE_MESSAGES if m["conversation_id"] == conv["id"]]
            unread_count = sum(1 for m in messages_for_conv if m["status"] != "read" and m["sender_id"] != int(user_id))
            if unread_count == 0:
                continue
                
        # Add to results
        user_conversations.append(format_conversation(conv))
    
    # Apply pagination
    start = min(skip, len(user_conversations))
    end = min(skip + limit, len(user_conversations))
    
    return user_conversations[start:end]

@router.post("/conversations", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate
):
    """
    Create a new conversation.
    """
    # In a real implementation, this would insert into the database
    # For now, we'll create a fake conversation and return it
    new_id = str(uuid4())
    now = datetime.now().isoformat()
    
    # Create new conversation object
    new_conversation = {
        "id": new_id,
        "title": conversation.title or "",
        "created_at": now,
        "updated_at": now,
        "last_message_at": now,
        "is_group": conversation.type == "group",
        "entity_type": None,
        "entity_id": None,
        "participants": [
            {
                "id": i+1,
                "user_id": int(p.id),
                "role": p.type,
                "joined_at": now,
                "last_read_at": now,
                "status": "active"
            }
            for i, p in enumerate(conversation.participants)
        ]
    }
    
    # In a real implementation, we would save this to the database
    # and set associated entities
    
    return format_conversation(new_conversation)

@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str
):
    """
    Get a specific conversation by ID.
    """
    # Find the conversation in our fake data
    for conv in FAKE_CONVERSATIONS:
        if str(conv["id"]) == conversation_id:
            return format_conversation(conv)
    
    # If not found, return 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Conversation with ID {conversation_id} not found"
    )

@router.put("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: str,
    conversation_update: ConversationUpdate
):
    """
    Update an existing conversation.
    """
    # Find the conversation in our fake data
    for i, conv in enumerate(FAKE_CONVERSATIONS):
        if str(conv["id"]) == conversation_id:
            # In a real implementation, we would update the database
            # For now, we'll just update our in-memory data
            if conversation_update.title is not None:
                FAKE_CONVERSATIONS[i]["title"] = conversation_update.title
                
            # Update timestamp
            FAKE_CONVERSATIONS[i]["updated_at"] = datetime.now().isoformat()
            
            return format_conversation(FAKE_CONVERSATIONS[i])
    
    # If not found, return 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Conversation with ID {conversation_id} not found"
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str
):
    """
    Delete a conversation.
    """
    # In a real implementation, this would be a soft delete that marks the conversation as archived
    # For our mock implementation, we'll just filter it out in our function return results
    
    # Check if the conversation exists
    if not any(str(conv["id"]) == conversation_id for conv in FAKE_CONVERSATIONS):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    # No actual deletion since we're using static data
    return None

# Messages endpoints
@router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    before: Optional[datetime] = None
):
    """
    Get messages for a specific conversation.
    
    - conversation_id: ID of the conversation
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return (pagination)
    - before: Only return messages created before this timestamp
    """
    # Check if conversation exists
    if not any(str(conv["id"]) == conversation_id for conv in FAKE_CONVERSATIONS):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    # Filter messages for this conversation
    conversation_messages = [m for m in FAKE_MESSAGES if str(m["conversation_id"]) == conversation_id]
    
    # Apply before filter if specified
    if before:
        conversation_messages = [m for m in conversation_messages if datetime.fromisoformat(m["created_at"].replace('Z', '+00:00')) < before]
    
    # Sort by created_at (oldest first for chat history)
    conversation_messages.sort(key=lambda x: x["created_at"])
    
    # Apply pagination
    start = min(skip, len(conversation_messages))
    end = min(skip + limit, len(conversation_messages))
    paginated_messages = conversation_messages[start:end]
    
    # Format messages for API response
    formatted_messages = [format_message(msg) for msg in paginated_messages]
    
    return formatted_messages

@router.post("/conversations/{conversation_id}/messages", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    conversation_id: str,
    message: MessageCreate
):
    """
    Create a new message in a conversation.
    """
    # Check if conversation exists
    if not any(str(conv["id"]) == conversation_id for conv in FAKE_CONVERSATIONS):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    # Create new message
    new_id = str(uuid4())
    now = datetime.now().isoformat()
    
    # In a real implementation, this would be saved to the database
    new_message = {
        "id": new_id,
        "conversation_id": int(conversation_id),
        "content": message.content,
        "sender_id": int(message.sender.id),
        "created_at": now,
        "updated_at": now,
        "status": "sent" if not message.scheduled_for else "draft",
        "type": "text",
        "template_id": None,
        "entity_references": [
            {
                "type": entity.type,
                "id": int(entity.id),
                "name": entity.name
            }
            for entity in (message.referenced_entities or [])
        ],
        "attachments": [
            {
                "id": attachment.id,
                "file_name": attachment.name,
                "file_size": attachment.size,
                "file_type": attachment.mime_type or "application/octet-stream",
                "storage_path": f"attachments/{attachment.id}_{attachment.name}",
                "uploaded_at": now
            }
            for attachment in (message.attachments or [])
        ]
    }
    
    # In a real implementation, we would update the conversation's last_message_at
    # and potentially trigger notifications
    
    # Format for API response
    return format_message(new_message)

@router.post("/messages/bulk", response_model=List[Message], status_code=status.HTTP_201_CREATED)
async def send_bulk_messages(
    messages: List[MessageCreate]
):
    """
    Send messages to multiple recipients in bulk.
    """
    # In a real implementation, this would create multiple messages
    # For now, we'll just return a stub response
    result = []
    now = datetime.now()
    
    for i, msg in enumerate(messages):
        new_id = str(uuid4())
        conversation_id = f"temp_{i}"  # In a real implementation, this would be determined dynamically
        
        result.append(Message(
            id=new_id,
            conversation_id=conversation_id,
            content=msg.content,
            sender=msg.sender,
            recipients=msg.recipients,
            attachments=msg.attachments,
            referenced_entities=msg.referenced_entities,
            status="sent" if not msg.scheduled_for else "draft",
            created_at=now,
            scheduled_for=msg.scheduled_for,
            priority=msg.priority,
            flags=[]
        ))
    
    return result

@router.put("/messages/{message_id}", response_model=Message)
async def update_message(
    message_id: str,
    message_update: MessageUpdate
):
    """
    Update an existing message (status or flags).
    """
    # Find the message in our fake data
    for i, msg in enumerate(FAKE_MESSAGES):
        if str(msg["id"]) == message_id:
            # In a real implementation, we would update the database
            # For now, we'll update our in-memory representation
            if message_update.status:
                FAKE_MESSAGES[i]["status"] = message_update.status
                
            # Update timestamp
            FAKE_MESSAGES[i]["updated_at"] = datetime.now().isoformat()
            
            return format_message(FAKE_MESSAGES[i])
    
    # If not found, return 404
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Message with ID {message_id} not found"
    )

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str
):
    """
    Delete a message.
    """
    # Check if the message exists
    if not any(str(msg["id"]) == message_id for msg in FAKE_MESSAGES):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message with ID {message_id} not found"
        )
    
    # In a real implementation, this would be a soft delete or hard delete
    # For our mock implementation, we don't need to do anything
    return None

@router.post("/messages/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_messages_read(
    request: MarkMessagesReadRequest
):
    """
    Mark multiple messages as read.
    """
    # In a real implementation, this would update the message status in the database
    # For now, let's update our in-memory representation
    for i, msg in enumerate(FAKE_MESSAGES):
        if str(msg["id"]) in request.message_ids:
            FAKE_MESSAGES[i]["status"] = "read"
    
    return None

# Message Templates endpoints
@router.get("/message-templates", response_model=List[MessageTemplate])
async def get_message_templates(
    category: Optional[str] = None
):
    """
    Get message templates, optionally filtered by category.
    """
    # In a real implementation, this would query a database table
    # For now, we'll define some fake templates
    templates = [
        {
            "id": "1",
            "name": "Interview Invitation",
            "content": "Hello {candidate_name},\n\nWe are pleased to invite you for an interview for the {job_title} position at {company_name}. The interview is scheduled for {interview_date} at {interview_time}.\n\nPlease confirm your availability.\n\nRegards,\n{recruiter_name}",
            "category": "interviews",
            "variables": ["candidate_name", "job_title", "company_name", "interview_date", "interview_time", "recruiter_name"],
            "created_at": "2024-01-15T10:00:00",
            "updated_at": "2024-01-15T10:00:00"
        },
        {
            "id": "2",
            "name": "Job Offer",
            "content": "Dear {candidate_name},\n\nWe are delighted to offer you the position of {job_title} at {company_name} with a starting salary of {salary}.\n\nYour start date would be {start_date}.\n\nPlease review the attached offer letter and respond with your acceptance by {response_deadline}.\n\nCongratulations,\n{recruiter_name}",
            "category": "offers",
            "variables": ["candidate_name", "job_title", "company_name", "salary", "start_date", "response_deadline", "recruiter_name"],
            "created_at": "2024-01-15T11:00:00",
            "updated_at": "2024-01-15T11:00:00"
        },
        {
            "id": "3",
            "name": "Application Acknowledgment",
            "content": "Hello {candidate_name},\n\nThank you for applying for the {job_title} position at {company_name}. We've received your application and will review it shortly.\n\nBest regards,\n{recruiter_name}",
            "category": "applications",
            "variables": ["candidate_name", "job_title", "company_name", "recruiter_name"],
            "created_at": "2024-01-16T09:00:00",
            "updated_at": "2024-01-16T09:00:00"
        },
        {
            "id": "4",
            "name": "Rejection Letter",
            "content": "Dear {candidate_name},\n\nThank you for your interest in the {job_title} position at {company_name} and for taking the time to go through our interview process.\n\nAfter careful consideration, we have decided to proceed with other candidates whose qualifications better match our current needs.\n\nWe appreciate your interest in {company_name} and wish you all the best in your job search.\n\nRegards,\n{recruiter_name}",
            "category": "rejections",
            "variables": ["candidate_name", "job_title", "company_name", "recruiter_name"],
            "created_at": "2024-01-16T10:00:00",
            "updated_at": "2024-01-16T10:00:00"
        },
        {
            "id": "5",
            "name": "Interview Reminder",
            "content": "Hello {candidate_name},\n\nThis is a friendly reminder about your interview for the {job_title} position tomorrow, {interview_date} at {interview_time}.\n\nThe interview will be with {interviewer_name}, {interviewer_title}.\n\nLooking forward to meeting you,\n{recruiter_name}",
            "category": "interviews",
            "variables": ["candidate_name", "job_title", "interview_date", "interview_time", "interviewer_name", "interviewer_title", "recruiter_name"],
            "created_at": "2024-01-17T09:00:00",
            "updated_at": "2024-01-17T09:00:00"
        }
    ]
    
    # Apply category filter if specified
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    return templates

@router.post("/message-templates", response_model=MessageTemplate, status_code=status.HTTP_201_CREATED)
async def create_message_template(
    template: MessageTemplateCreate
):
    """
    Create a new message template.
    """
    # In a real implementation, this would insert into the database
    new_id = str(uuid4())
    now = datetime.now().isoformat()
    
    new_template = {
        "id": new_id,
        "name": template.name,
        "content": template.content,
        "category": template.category,
        "variables": template.variables or [],
        "created_at": now,
        "updated_at": now
    }
    
    # In a real implementation, we would save this to the database
    
    return new_template

@router.put("/message-templates/{template_id}", response_model=MessageTemplate)
async def update_message_template(
    template_id: str,
    template_update: MessageTemplateUpdate
):
    """
    Update an existing message template.
    """
    # In a real implementation, we would find and update the template in the database
    # For our mock implementation, we'll create a response with the updates
    
    # Start with a mock existing template
    existing_template = {
        "id": template_id,
        "name": "Existing Template",
        "content": "Old content",
        "category": "old-category",
        "variables": [],
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }
    
    # Apply updates
    if template_update.name is not None:
        existing_template["name"] = template_update.name
    if template_update.content is not None:
        existing_template["content"] = template_update.content
    if template_update.category is not None:
        existing_template["category"] = template_update.category
    if template_update.variables is not None:
        existing_template["variables"] = template_update.variables
    
    # Update timestamp
    existing_template["updated_at"] = datetime.now().isoformat()
    
    return existing_template

@router.delete("/message-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message_template(
    template_id: str
):
    """
    Delete a message template.
    """
    # In a real implementation, this would delete from the database
    # For our mock implementation, we don't need to do anything
    return None

# Notification Preferences endpoints
@router.get("/notification-preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    user_id: str
):
    """
    Get notification preferences for a user.
    """
    # In a real implementation, this would query the database
    # For now, return default preferences
    return NotificationPreferences(
        user_id=user_id,
        in_app=True,
        email=True,
        email_digest="never",
        sms=False,
        do_not_disturb_start=None,
        do_not_disturb_end=None
    )

@router.put("/notification-preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    user_id: str,
    preferences: NotificationPreferencesUpdate
):
    """
    Update notification preferences for a user.
    """
    # In a real implementation, this would update the database
    # For now, we'll create a response with the updates
    
    # Start with default preferences
    prefs = NotificationPreferences(
        user_id=user_id,
        in_app=True,
        email=True,
        email_digest="never",
        sms=False,
        do_not_disturb_start=None,
        do_not_disturb_end=None
    )
    
    # Apply updates
    update_data = {k: v for k, v in preferences.dict().items() if v is not None}
    for key, value in update_data.items():
        setattr(prefs, key, value)
    
    return prefs

# Attachment handling
@router.post("/attachments", response_model=AttachmentBase)
async def upload_attachment():
    """
    Upload an attachment for a message.
    """
    # In a real implementation, this would handle file upload and storage
    # For our mock implementation, we'll just return a dummy response
    new_id = str(uuid4())
    
    return AttachmentBase(
        id=new_id,
        type="file",
        name="uploaded_file.pdf",
        url=f"/api/v1/attachments/{new_id}",
        size=123456,
        mime_type="application/pdf"
    )