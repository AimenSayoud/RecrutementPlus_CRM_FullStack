// api/messaging.api.ts

import { apiRequest } from './config';
import {
  Conversation,
  ConversationCreate,
  Message,
  MessageCreate,
  EmailTemplate,
  ConversationWithDetails,
  MessageWithDetails,
} from '@/types/messaging.types';
import { ListResponse } from '@/types/common.types';

export const messagingApi = {
  // Conversations
  getConversations: async (params?: {
    page?: number;
    page_size?: number;
    conversation_type?: string;
    is_archived?: boolean;
  }): Promise<ListResponse<ConversationWithDetails>> => {
    return apiRequest('get', '/conversations', { params });
  },
  
  getConversation: async (id: string): Promise<ConversationWithDetails> => {
    return apiRequest('get', `/conversations/${id}`);
  },
  
  createConversation: async (data: ConversationCreate): Promise<Conversation> => {
    return apiRequest('post', '/conversations', data);
  },
  
  updateConversation: async (id: string, data: Partial<ConversationCreate>): Promise<Conversation> => {
    return apiRequest('put', `/conversations/${id}`, data);
  },
  
  archiveConversation: async (id: string): Promise<void> => {
    await apiRequest('post', `/conversations/${id}/archive`);
  },
  
  deleteConversation: async (id: string): Promise<void> => {
    await apiRequest('delete', `/conversations/${id}`);
  },
  
  // Messages
  getMessages: async (conversationId: string, params?: {
    page?: number;
    page_size?: number;
    message_type?: string;
  }): Promise<ListResponse<MessageWithDetails>> => {
    return apiRequest('get', `/conversations/${conversationId}/messages`, { params });
  },
  
  sendMessage: async (conversationId: string, data: MessageCreate): Promise<Message> => {
    return apiRequest('post', `/conversations/${conversationId}/messages`, data);
  },
  
  updateMessage: async (messageId: string, data: { content: string }): Promise<Message> => {
    return apiRequest('put', `/messages/${messageId}`, data);
  },
  
  deleteMessage: async (messageId: string): Promise<void> => {
    await apiRequest('delete', `/messages/${messageId}`);
  },
  
  markAsRead: async (messageId: string): Promise<void> => {
    await apiRequest('post', `/messages/${messageId}/read`);
  },
  
  // Reactions
  addReaction: async (messageId: string, reaction: string): Promise<void> => {
    await apiRequest('post', `/messages/${messageId}/react`, { reaction_type: reaction });
  },
  
  removeReaction: async (messageId: string, reaction: string): Promise<void> => {
    await apiRequest('delete', `/messages/${messageId}/react/${reaction}`);
  },
  
  // Search
  searchMessages: async (query: string, conversationId?: string): Promise<ListResponse<MessageWithDetails>> => {
    return apiRequest('post', '/search', { 
      query, 
      conversation_id: conversationId,
      limit: 50 
    });
  },
  
  // Templates
  getEmailTemplates: async (params?: {
    template_type?: string;
    is_active?: boolean;
  }): Promise<ListResponse<EmailTemplate>> => {
    return apiRequest('get', '/templates', { params });
  },
  
  // Unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiRequest('get', '/unread-count');
  },
};

