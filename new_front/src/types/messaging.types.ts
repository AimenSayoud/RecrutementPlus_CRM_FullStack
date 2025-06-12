// types/messaging.types.ts

import { ConversationType, MessageType, MessageStatus } from './enums';

export interface Conversation {
  id: string;
  title?: string | null;
  type: ConversationType;
  description?: string | null;
  created_by_id: string;
  is_archived: boolean;
  is_pinned: boolean;
  is_private: boolean;
  allow_file_sharing: boolean;
  total_messages: number;
  last_message_at?: string | null;
  last_activity_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  participant_count: number;
  participant_names?: string[] | null;
  last_message_preview?: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  message_type: MessageType;
  status: MessageStatus;
  parent_message_id?: string | null;
  reply_to_id?: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  edited_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  metadata?: Record<string, any> | null;
  mentions?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface MessageWithDetails extends Message {
  sender_name?: string | null;
  sender_avatar?: string | null;
  attachments?: MessageAttachment[] | null;
  reactions?: MessageReaction[] | null;
  read_receipts?: MessageReadReceipt[] | null;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface MessageReaction {
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface MessageReadReceipt {
  user_id: string;
  read_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  description?: string | null;
  placeholders?: string[] | null;
  is_active: boolean;
  usage_count: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title?: string | null;
  type?: ConversationType;
  description?: string | null;
  participant_ids?: string[] | null;
}

export interface MessageCreate {
  content?: string | null;
  message_type?: MessageType;
  reply_to_id?: string | null;
  mentions?: string[] | null;
}

export interface EmailTemplateCreate {
  name: string;
  subject: string;
  body: string;
  template_type: string;
  description?: string | null;
  placeholders?: string[] | null;
}