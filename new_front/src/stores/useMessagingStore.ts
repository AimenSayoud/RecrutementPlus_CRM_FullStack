// stores/useMessagingStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { messagingApi } from '@/api/messaging.api';
import { 
  ConversationWithDetails, 
  MessageWithDetails, 
  ConversationCreate,
  MessageCreate 
} from '@/types/messaging.types';

interface MessagingState {
  conversations: ConversationWithDetails[];
  currentConversation: ConversationWithDetails | null;
  messages: MessageWithDetails[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (data: ConversationCreate) => Promise<string>;
  markAsRead: (messageId: string) => Promise<void>;
  searchMessages: (query: string) => Promise<MessageWithDetails[]>;
  
  // UI state
  setCurrentConversation: (conversation: ConversationWithDetails | null) => void;
  clearError: () => void;
}

export const useMessagingStore = create<MessagingState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      messages: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingMessages: false,
      error: null,
      
      fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await messagingApi.getConversations({
            page_size: 100,
            is_archived: false,
          });
          set({ conversations: response.items, isLoading: false });
          
          // Fetch unread count
          const unreadResponse = await messagingApi.getUnreadCount();
          set({ unreadCount: unreadResponse.count });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch conversations', isLoading: false });
        }
      },
      
      fetchConversation: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const conversation = await messagingApi.getConversation(id);
          set({ currentConversation: conversation, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch conversation', isLoading: false });
        }
      },
      
      fetchMessages: async (conversationId) => {
        set({ isLoadingMessages: true, error: null });
        try {
          const response = await messagingApi.getMessages(conversationId, {
            page_size: 50,
          });
          set({ messages: response.items, isLoadingMessages: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch messages', isLoadingMessages: false });
        }
      },
      
      sendMessage: async (conversationId, content) => {
        const tempMessage: MessageWithDetails = {
          id: `temp-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: 'current-user',
          content,
          message_type: 'text' as any,
          status: 'sent' as any,
          is_edited: false,
          is_deleted: false,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender_name: 'You',
        };
        
        // Optimistically add message
        set((state) => ({
          messages: [...state.messages, tempMessage],
        }));
        
        try {
          const message = await messagingApi.sendMessage(conversationId, { content });
          
          // Replace temp message with real one
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === tempMessage.id ? { ...message, sender_name: 'You' } : m
            ),
          }));
          
          // Update conversation last message
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    last_message_preview: content,
                    last_message_at: new Date().toISOString(),
                  }
                : conv
            ),
          }));
        } catch (error: any) {
          // Remove temp message on error
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== tempMessage.id),
            error: error.detail || 'Failed to send message',
          }));
        }
      },
      
      createConversation: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const conversation = await messagingApi.createConversation(data);
          
          // Add to conversations list
          set((state) => ({
            conversations: [conversation as ConversationWithDetails, ...state.conversations],
            isLoading: false,
          }));
          
          return conversation.id;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to create conversation', isLoading: false });
          throw error;
        }
      },
      
      markAsRead: async (messageId) => {
        try {
          await messagingApi.markAsRead(messageId);
          
          // Update unread count
          set((state) => ({
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));
        } catch (error: any) {
          console.error('Failed to mark as read:', error);
        }
      },
      
      searchMessages: async (query) => {
        try {
          const response = await messagingApi.searchMessages(query);
          return response.items;
        } catch (error: any) {
          console.error('Failed to search messages:', error);
          return [];
        }
      },
      
      setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation, messages: [] });
      },
      
      clearError: () => set({ error: null }),
    })
  )
);