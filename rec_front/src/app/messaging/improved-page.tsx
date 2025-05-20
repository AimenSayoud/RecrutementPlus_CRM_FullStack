'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiMessageCircle, FiArrowLeft, FiInfo, FiPhone, FiVideo,
  FiMoreVertical, FiPaperclip, FiStar, FiX, FiCalendar,
  FiLink, FiClock, FiBriefcase, FiFile, FiUser, FiCheck,
  FiEdit, FiFilter, FiSearch, FiRefreshCw, FiChevronRight
} from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';
import useMessagingStore from '@/store/useMessagingStore';
import MessageComposer from '@/components/messaging/MessageComposer';
import RecipientSelector from '@/components/messaging/RecipientSelector';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { MessageStatus, Participant, MessageAttachment } from '@/types';

const MessagingPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, theme } = useTheme();
  const {
    conversations,
    filteredConversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    conversationsError,
    messagesError,
    isComposing,
    selectedRecipients,
    draftMessage,
    showContactDetails,
    searchTerm,
    activeFilter,
    unreadCount,
    fetchConversations,
    fetchMessages,
    fetchConversation,
    sendMessage,
    markMessagesAsRead,
    createConversation,
    toggleContactDetails,
    cancelComposing,
    selectRecipient,
    removeRecipient,
    updateDraftMessage,
    startComposing,
    setActiveConversation,
    setSearchTerm,
    setActiveFilter,
    resetErrors
  } = useMessagingStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadIndicatorVisible, setUnreadIndicatorVisible] = useState(false);
  const [newUnreadMessages, setNewUnreadMessages] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  
  // Check if we're in mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      setShowConversationList(window.innerWidth >= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Load initial conversations
  useEffect(() => {
    // You would typically get the current user's ID from auth
    fetchConversations("7");
  }, [fetchConversations]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0) {
      // If user isn't at bottom, show unread indicator
      setUnreadIndicatorVisible(true);
    }
  }, [messages, isAtBottom]);
  
  // Load conversation from URL parameter and fetch messages
  useEffect(() => {
    const conversationId = searchParams.get('id');
    if (conversationId && !isComposing) {
      // If we have an ID in URL but no active conversation, fetch it
      if (!activeConversation || activeConversation.id !== conversationId) {
        fetchConversation(conversationId);
      }
      // Fetch messages for this conversation
      fetchMessages(conversationId);
      
      // On mobile, show the message view instead of conversation list
      if (isMobileView) {
        setShowConversationList(false);
      }
    }
  }, [searchParams, activeConversation, fetchMessages, fetchConversation, isComposing, isMobileView]);
  
  // Handle scroll events to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isBottom);
    
    if (isBottom) {
      setUnreadIndicatorVisible(false);
    }
  };
  
  // Mark message as read when it becomes visible
  const handleMessageInView = (messageId: string) => {
    if (newUnreadMessages.includes(messageId)) {
      markMessagesAsRead([messageId]);
      setNewUnreadMessages(prev => prev.filter(id => id !== messageId));
    }
  };
  
  // Handle navigating back
  const handleBack = () => {
    if (isMobileView && activeConversation) {
      // On mobile, go back to conversation list
      setShowConversationList(true);
      setActiveConversation(null);
      router.push('/messaging');
    } else if (isComposing) {
      // Cancel compose mode
      cancelComposing();
    } else {
      // Go back to previous page
      router.push('/dashboard');
    }
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (conversationId: string) => {
    router.push(`/messaging?id=${conversationId}`);
    
    // On mobile, hide conversation list and show the selected conversation
    if (isMobileView) {
      setShowConversationList(false);
    }
  };
  
  // Handle send message
  const handleSendMessage = async (content: string, attachments?: MessageAttachment[]) => {
    if (!content.trim()) return;
    
    const currentUser: Participant = {
      id: "7", // You'd get this from auth
      name: "Admin User",
      type: "admin",
      avatar: null
    };
    
    if (isComposing) {
      // Create new conversation with selected recipients
      if (selectedRecipients.length === 0) return;
      
      const conversationData = {
        title: null,
        participants: [currentUser, ...selectedRecipients],
        type: selectedRecipients.length > 1 ? 'group' : 'individual' as any,
      };
      
      const conversationId = await createConversation(conversationData);
      
      if (conversationId) {
        // Send message using the new conversation
        const messageData = {
          content,
          sender: currentUser,
          recipients: selectedRecipients,
          conversation_id: conversationId,
          attachments: attachments
        };
        
        await sendMessage(messageData);
        
        // Navigate to the new conversation
        router.push(`/messaging?id=${conversationId}`);
      }
    } else if (activeConversation) {
      // Send message to existing conversation
      const messageData = {
        content,
        sender: currentUser,
        recipients: activeConversation.participants.filter(p => p.id !== currentUser.id),
        conversation_id: activeConversation.id,
        attachments: attachments
      };
      
      await sendMessage(messageData);
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: any[] }[] = [];
    let currentDate = '';
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      const dateStr = format(messageDate, 'yyyy-MM-dd');
      
      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({
          date: dateStr,
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  };
  
  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Format message time
  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a');
  };
  
  // Format last message time in conversation list
  const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    // If within the last week, show the day name
    if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEEE');
    }
    
    // Otherwise show the date
    return format(date, 'MM/dd/yyyy');
  };
  
  // Render message status icon
  const renderMessageStatus = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.READ:
        return (
          <div className="text-primary-500">
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.DELIVERED:
        return (
          <div style={{ color: theme === 'light' ? '#94A3B8' : '#64748B' }}>
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.SENT:
        return (
          <div style={{ color: theme === 'light' ? '#94A3B8' : '#64748B' }}>
            <FiCheck className="w-4 h-4" />
          </div>
        );
      case MessageStatus.FAILED:
        return (
          <div className="text-red-500">
            <FiX className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Get participant avatar
  const getParticipantAvatar = (participant: Participant) => {
    if (participant.avatar) {
      return <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />;
    }
    
    // Default avatar with color based on participant type
    const getBgColor = () => {
      switch (participant.type) {
        case 'candidate':
          return theme === 'light' ? '#EFF6FF' : '#1E3A8A';
        case 'employer':
          return theme === 'light' ? '#F0FDF4' : '#14532D';
        case 'admin':
          return theme === 'light' ? '#FEF2F2' : '#7F1D1D';
        case 'consultant':
          return theme === 'light' ? '#FFF7ED' : '#7C2D12';
        default:
          return theme === 'light' ? '#F1F5F9' : '#1E293B';
      }
    };
    
    const getTextColor = () => {
      switch (participant.type) {
        case 'candidate':
          return theme === 'light' ? '#1E40AF' : '#93C5FD';
        case 'employer':
          return theme === 'light' ? '#15803D' : '#86EFAC';
        case 'admin':
          return theme === 'light' ? '#B91C1C' : '#FCA5A5';
        case 'consultant':
          return theme === 'light' ? '#C2410C' : '#FDBA74';
        default:
          return colors.text;
      }
    };
    
    const getIcon = () => {
      switch (participant.type) {
        case 'candidate':
          return <FiUser className="w-5 h-5" />;
        case 'employer':
          return <FiBriefcase className="w-5 h-5" />;
        case 'admin':
        case 'consultant':
          return <FiUser className="w-5 h-5" />;
        default:
          return <FiUser className="w-5 h-5" />;
      }
    };
    
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: getBgColor(), color: getTextColor() }}
      >
        {getIcon()}
      </div>
    );
  };
  
  // Render attachment
  const renderAttachment = (attachment: MessageAttachment) => {
    return (
      <div 
        key={attachment.id}
        className="relative group p-2 border rounded-lg flex items-center gap-2 my-2"
        style={{
          backgroundColor: theme === 'light' ? '#F9FAFB' : '#1F2937',
          borderColor: colors.border
        }}
      >
        <div className="w-10 h-10 rounded flex items-center justify-center"
          style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}
        >
          <FiFile className="w-5 h-5" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
        </div>
        <div>
          <div className="text-sm font-medium">{attachment.name}</div>
          <div className="text-xs" style={{ color: `${colors.text}80` }}>
            {(attachment.file_size / 1024).toFixed(0)} KB
          </div>
        </div>
      </div>
    );
  };
  
  // Get a truncated preview of the message content
  const getTruncatedContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  // Render the header for various states
  const renderHeader = () => {
    if (isMobileView && mobileSearchVisible) {
      return (
        <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: colors.border }}>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileSearchVisible(false)}
            aria-label="Back"
          >
            <FiArrowLeft className="w-5 h-5" style={{ color: colors.text }} />
          </button>
          <div className="flex-1">
            <input
              type="text"
              className="w-full p-2 rounded-md border"
              style={{ 
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text
              }}
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      );
    }
    
    if (isMobileView && !showConversationList && activeConversation) {
      // Individual conversation header on mobile
      return (
        <div 
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{ borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleBack}
              aria-label="Back to messages"
            >
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.text }} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {activeConversation.participants.length > 0 && activeConversation.participants[0] && 
                  getParticipantAvatar(activeConversation.participants[0])}
              </div>
              <div>
                <h1 className="font-medium" style={{ color: colors.text }}>
                  {activeConversation.title || 
                    (activeConversation.participants.length > 0 ? 
                    activeConversation.participants[0].name : 'Conversation')}
                </h1>
                <p className="text-xs" style={{ color: `${colors.text}80` }}>
                  {activeConversation.type === 'group' 
                    ? `${activeConversation.participants.length} participants` 
                    : activeConversation.participants[0]?.type || ''}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={toggleContactDetails}
              aria-label="Contact details"
            >
              <FiInfo className="w-5 h-5" style={{ color: colors.text }} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="More options"
            >
              <FiMoreVertical className="w-5 h-5" style={{ color: colors.text }} />
            </button>
          </div>
        </div>
      );
    }
    
    // Main header (desktop or mobile conversation list)
    return (
      <div 
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          {!isMobileView && (
            <button
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleBack}
              aria-label="Back to dashboard"
            >
              <FiArrowLeft className="w-5 h-5" style={{ color: colors.text }} />
            </button>
          )}
          
          <h1 className="text-lg font-medium" style={{ color: colors.text }}>Messages</h1>
          
          {unreadCount > 0 && (
            <div 
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: colors.primary, color: 'white' }}
            >
              {unreadCount}
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          {isMobileView ? (
            <>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileSearchVisible(true)}
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5" style={{ color: colors.text }} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ml-1"
                onClick={startComposing}
                aria-label="New message"
              >
                <FiEdit className="w-5 h-5" style={{ color: colors.text }} />
              </button>
            </>
          ) : (
            <>
              <div className="relative mr-2 w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="w-4 h-4" style={{ color: `${colors.text}60` }} />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 rounded-md border"
                  style={{ 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className="p-2 rounded-md flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ 
                  backgroundColor: colors.primary, 
                  color: 'white' 
                }}
                onClick={startComposing}
              >
                <FiEdit className="w-4 h-4" />
                <span>New Message</span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      {renderHeader()}
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List - show based on state */}
        {(showConversationList || !isMobileView) && (
          <div 
            className={`${isMobileView ? 'w-full' : 'w-80 min-w-80'} border-r flex flex-col overflow-hidden`}
            style={{ borderColor: colors.border }}
          >
            {/* Filters */}
            <div 
              className="p-2 flex gap-2 border-b overflow-x-auto"
              style={{ borderColor: colors.border }}
            >
              <button
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
                  activeFilter !== 'all' ? `hover:${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}` : ''
                }`}
                style={{
                  backgroundColor: activeFilter === 'all' ? colors.primary : (theme === 'light' ? '#F3F4F6' : '#374151'),
                  color: activeFilter === 'all' ? '#FFFFFF' : (theme === 'light' ? '#4B5563' : '#D1D5DB')
                }}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
                  activeFilter !== 'unread' ? `hover:${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}` : ''
                }`}
                style={{
                  backgroundColor: activeFilter === 'unread' ? colors.primary : (theme === 'light' ? '#F3F4F6' : '#374151'),
                  color: activeFilter === 'unread' ? '#FFFFFF' : (theme === 'light' ? '#4B5563' : '#D1D5DB')
                }}
                onClick={() => setActiveFilter('unread')}
              >
                Unread
              </button>
              <button
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
                  activeFilter !== 'group' ? `hover:${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}` : ''
                }`}
                style={{
                  backgroundColor: activeFilter === 'group' ? colors.primary : (theme === 'light' ? '#F3F4F6' : '#374151'),
                  color: activeFilter === 'group' ? '#FFFFFF' : (theme === 'light' ? '#4B5563' : '#D1D5DB')
                }}
                onClick={() => setActiveFilter('group')}
              >
                Groups
              </button>
              <button
                className="px-3 py-1.5 text-xs rounded-md flex items-center gap-1 whitespace-nowrap"
                style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
                  color: theme === 'light' ? '#4B5563' : '#D1D5DB'
                }}
                aria-label="More filters"
              >
                <FiFilter className="w-3.5 h-3.5" />
                <span>More</span>
              </button>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingConversations && filteredConversations.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin mb-3"
                      style={{ borderColor: colors.border, borderTopColor: colors.primary }}
                    />
                    <p style={{ color: `${colors.text}80` }}>Loading conversations...</p>
                  </div>
                </div>
              ) : conversationsError ? (
                <div className="p-4 text-center">
                  <p className="text-red-500 dark:text-red-400 mb-2">Error loading conversations</p>
                  <button
                    className="text-sm flex items-center gap-1 mx-auto"
                    style={{ color: colors.primary }}
                    onClick={() => fetchConversations('7')}
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center" style={{ color: `${colors.text}80` }}>
                  <p>No conversations found</p>
                  {searchTerm && (
                    <p className="mt-1 text-sm">Try a different search term</p>
                  )}
                  {activeFilter !== 'all' && (
                    <button
                      className="mt-2 text-sm"
                      style={{ color: colors.primary }}
                      onClick={() => setActiveFilter('all')}
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              ) : (
                filteredConversations.map(conversation => {
                  // Check if this is the active conversation
                  const isActive = activeConversation?.id === conversation.id;
                  
                  // Get the other participant (for 1:1 conversations)
                  const otherParticipant = conversation.participants[0] || null;
                  
                  // Get the last message preview
                  const lastMessage = conversation.last_message || null;
                  
                  return (
                    <div
                      key={conversation.id}
                      className={`px-4 py-3 border-b cursor-pointer transition-colors ${
                        isActive 
                          ? theme === 'light' ? 'bg-gray-100' : 'bg-gray-800' 
                          : `hover:${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`
                      }`}
                      style={{ borderColor: colors.border }}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            {otherParticipant && getParticipantAvatar(otherParticipant)}
                          </div>
                          {conversation.unread_count > 0 && (
                            <div
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                              style={{ backgroundColor: colors.primary, color: 'white' }}
                            >
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                        
                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 
                              className={`font-medium truncate max-w-[140px] ${conversation.unread_count > 0 ? 'font-semibold' : ''}`}
                              style={{ color: colors.text }}
                            >
                              {conversation.title || (otherParticipant ? otherParticipant.name : 'Conversation')}
                            </h3>
                            <span className="text-xs whitespace-nowrap" style={{ color: `${colors.text}70` }}>
                              {lastMessage ? formatConversationTime(lastMessage.timestamp) : ''}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            <p 
                              className={`text-sm truncate max-w-[160px] ${conversation.unread_count > 0 ? 'font-medium' : ''}`}
                              style={{ color: conversation.unread_count > 0 ? colors.text : `${colors.text}70` }}
                            >
                              {lastMessage ? getTruncatedContent(lastMessage.content, 30) : 'No messages yet'}
                            </p>
                            
                            <FiChevronRight 
                              className="w-4 h-4 flex-shrink-0" 
                              style={{ color: theme === 'light' ? '#CBD5E1' : '#475569' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        
        {/* Conversation View */}
        {(!isMobileView || (isMobileView && !showConversationList)) && (
          <div className="flex-1 flex flex-col relative">
            {isComposing ? (
              <div className="p-4">
                <h2 className="text-sm font-medium mb-2" style={{ color: colors.text }}>To:</h2>
                <RecipientSelector
                  selectedRecipients={selectedRecipients}
                  onAddRecipient={selectRecipient}
                  onRemoveRecipient={removeRecipient}
                  placeholder="Search for people or teams..."
                />
              </div>
            ) : null}
            
            {/* Messages container */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
              style={{ 
                maxHeight: 'calc(100vh - 200px)', 
                height: activeConversation ? 'calc(100vh - 200px)' : '100%'
              }}
            >
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-t-primary rounded-full animate-spin mb-3"
                      style={{ borderColor: colors.border, borderTopColor: colors.primary }}
                    />
                    <p style={{ color: colors.text }}>Loading messages...</p>
                  </div>
                </div>
              ) : messagesError ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-center p-4">
                    <p className="text-red-500 dark:text-red-400 mb-2">Error loading messages</p>
                    <p style={{ color: `${colors.text}80` }}>
                      {messagesError.includes('mock') ? 'Using mock data due to API issues' : 'Please try again later'}
                    </p>
                    <button
                      className="mt-3 px-4 py-2 rounded-md text-sm"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                      onClick={() => activeConversation && fetchMessages(activeConversation.id)}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : messages.length === 0 && !isComposing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiMessageCircle className="w-8 h-8" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    {activeConversation ? 'No messages yet' : 'Select a conversation'}
                  </h3>
                  <p className="text-center mb-4" style={{ color: `${colors.text}80` }}>
                    {activeConversation 
                      ? 'Start the conversation by sending a message below'
                      : 'Choose a conversation from the list or start a new one'}
                  </p>
                  {!activeConversation && (
                    <button
                      className="px-4 py-2 rounded-md text-sm"
                      style={{ backgroundColor: colors.primary, color: 'white' }}
                      onClick={startComposing}
                    >
                      Start a New Conversation
                    </button>
                  )}
                </div>
              ) : (
                // Group messages by date
                groupMessagesByDate().map(group => (
                  <div key={group.date} className="space-y-4 mb-5">
                    {/* Date header */}
                    <div className="flex justify-center">
                      <div 
                        className="px-3 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                          color: `${colors.text}80`
                        }}
                      >
                        {formatDateHeader(group.date)}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    {group.messages.map((message, index) => {
                      // Check if this is a new sender compared to previous message
                      const prevMessage = index > 0 ? group.messages[index - 1] : null;
                      const isNewSender = !prevMessage || prevMessage.sender.id !== message.sender.id;
                      
                      // Check if this is the last message from this sender
                      const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;
                      const isLastFromSender = !nextMessage || nextMessage.sender.id !== message.sender.id;
                      
                      // Check if this message is from current user (update this to match your auth)
                      const isYou = message.sender.id === '7';
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}
                          onMouseEnter={() => handleMessageInView(message.id)}
                        >
                          <div className={`flex ${isYou ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                            {/* Avatar - only show for first message in a group */}
                            {isNewSender && !isYou && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                {getParticipantAvatar(message.sender)}
                              </div>
                            )}
                            
                            <div 
                              className={`flex flex-col mx-2 ${isNewSender ? '' : isYou ? 'mr-9' : 'ml-9'}`}
                            >
                              {/* Sender name - only show for first message in a group */}
                              {isNewSender && !isYou && (
                                <div className="text-xs font-medium ml-1 mb-1" style={{ color: colors.text }}>
                                  {message.sender.name}
                                </div>
                              )}
                              
                              {/* Message bubble */}
                              <div
                                className={`p-3 rounded-lg shadow-sm ${isYou ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                                style={{ 
                                  backgroundColor: isYou 
                                    ? colors.primary 
                                    : theme === 'light' ? '#F1F5F9' : '#1E293B',
                                  color: isYou ? 'white' : colors.text
                                }}
                              >
                                {/* Message content */}
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content}
                                </div>
                                
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    {message.attachments.map(attachment => renderAttachment(attachment))}
                                  </div>
                                )}
                                
                                {/* Entity references */}
                                {message.entity_references && message.entity_references.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.entity_references.map(entity => (
                                      <div
                                        key={`${entity.type}-${entity.id}`}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                                        style={{ 
                                          backgroundColor: theme === 'light' ? `${colors.primary}15` : `${colors.primary}30`,
                                          color: colors.primary
                                        }}
                                      >
                                        <span>{entity.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Time and status - only show for last message in a group */}
                              {isLastFromSender && (
                                <div 
                                  className={`text-[10px] mt-1 flex items-center gap-1 ${isYou ? 'justify-end' : 'justify-start'}`}
                                  style={{ color: isYou ? 'rgba(255, 255, 255, 0.8)' : `${colors.text}70` }}
                                >
                                  <span>{formatMessageTime(message.created_at)}</span>
                                  {isYou && renderMessageStatus(message.status)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              
              {/* Anchor for scrolling to the bottom */}
              <div ref={messagesEndRef}></div>
              
              {/* New message indicator */}
              {unreadIndicatorVisible && (
                <div 
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg cursor-pointer"
                  style={{ 
                    backgroundColor: colors.primary, 
                    color: 'white' 
                  }}
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setUnreadIndicatorVisible(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>New messages</span>
                    <FiChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Message composer */}
            {(activeConversation || isComposing) && (
              <div 
                className="border-t p-1" 
                style={{ borderColor: colors.border }}
              >
                <MessageComposer 
                  disabled={isComposing && selectedRecipients.length === 0}
                  placeholder={isComposing && selectedRecipients.length === 0 
                    ? "Select recipients to start typing..." 
                    : "Type a message..."}
                  conversationId={activeConversation?.id}
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Contact details sidebar - hidden on mobile unless showContactDetails is true */}
        {showContactDetails && activeConversation && (
          <div 
            className={`${isMobileView ? 'absolute inset-0 z-10' : 'w-80'} border-l bg-card flex-shrink-0 overflow-y-auto`}
            style={{ borderColor: colors.border, backgroundColor: colors.card }}
          >
            {/* Close button for mobile */}
            {isMobileView && (
              <div className="absolute top-2 right-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={toggleContactDetails}
                  aria-label="Close details"
                >
                  <FiX className="w-5 h-5" style={{ color: colors.text }} />
                </button>
              </div>
            )}
            
            {/* Contact header */}
            <div className="p-4 flex flex-col items-center border-b" style={{ borderColor: colors.border }}>
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
                {activeConversation.participants[0] && 
                  getParticipantAvatar(activeConversation.participants[0])}
              </div>
              <h2 className="text-lg font-medium" style={{ color: colors.text }}>
                {activeConversation.title || 
                  (activeConversation.participants.length > 0 ? 
                  activeConversation.participants[0].name : 'Conversation')}
              </h2>
              <p className="text-sm" style={{ color: `${colors.text}80` }}>
                {activeConversation.type === 'group' 
                  ? `${activeConversation.participants.length} participants` 
                  : activeConversation.participants[0]?.type || ''}
              </p>
              <div className="flex gap-4 mt-3">
                <button
                  className="flex flex-col items-center"
                  aria-label="Call"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiPhone className="w-5 h-5" style={{ color: colors.text }} />
                  </div>
                  <span className="text-xs" style={{ color: colors.text }}>Call</span>
                </button>
                <button
                  className="flex flex-col items-center"
                  aria-label="Video"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiVideo className="w-5 h-5" style={{ color: colors.text }} />
                  </div>
                  <span className="text-xs" style={{ color: colors.text }}>Video</span>
                </button>
                <button
                  className="flex flex-col items-center"
                  aria-label="Star"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B' }}
                  >
                    <FiStar className="w-5 h-5" style={{ color: colors.text }} />
                  </div>
                  <span className="text-xs" style={{ color: colors.text }}>Star</span>
                </button>
              </div>
            </div>
            
            {/* Contact details */}
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3" style={{ color: colors.text }}>About</h3>
              
              {activeConversation.participants.map(participant => (
                <div 
                  key={participant.id}
                  className="mb-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {getParticipantAvatar(participant)}
                    </div>
                    <div>
                      <h4 className="font-medium" style={{ color: colors.text }}>{participant.name}</h4>
                      <p className="text-xs capitalize" style={{ color: `${colors.text}80` }}>{participant.type}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm" style={{ color: `${colors.text}90` }}>
                    {/* Some example contact details based on user type */}
                    {participant.type === 'candidate' && (
                      <p>Software Engineer with 3+ years of experience in React and Node.js</p>
                    )}
                    {participant.type === 'employer' && (
                      <p>Tech company in the fintech sector</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Files shared section */}
              <h3 className="text-sm font-medium mt-4 mb-3" style={{ color: colors.text }}>Shared Files</h3>
              <div className="space-y-2">
                {messages.filter(m => m.attachments && m.attachments.length > 0)
                  .flatMap(m => m.attachments || [])
                  .slice(0, 3)
                  .map(attachment => (
                    <div 
                      key={attachment.id}
                      className="flex items-center p-2 rounded-md"
                      style={{
                        backgroundColor: theme === 'light' ? '#F1F5F9' : '#1E293B',
                      }}
                    >
                      <div className="w-8 h-8 rounded flex items-center justify-center mr-3"
                        style={{ backgroundColor: theme === 'light' ? '#E5E7EB' : '#374151' }}
                      >
                        <FiFile className="w-4 h-4" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: colors.text }}>{attachment.name}</div>
                        <div className="text-xs" style={{ color: `${colors.text}70` }}>
                          {(attachment.file_size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                  ))}
                
                {messages.filter(m => m.attachments && m.attachments.length > 0).length === 0 && (
                  <p className="text-sm text-center py-2" style={{ color: `${colors.text}70` }}>
                    No files shared in this conversation
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;