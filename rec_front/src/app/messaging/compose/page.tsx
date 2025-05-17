'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiSend, FiPaperclip, FiClock } from 'react-icons/fi';
import { useDataStore } from '@/store/useDataStore';
import { useAuth } from '@/app/context/AuthContext';
import { useTheme } from '@/app/context/ThemeContext';
import RecipientSelector from '@/components/messaging/RecipientSelector';
import MessageComposer from '@/components/messaging/MessageComposer';
import Button from '@/components/ui/Button';
import { ParticipantRole } from '@/types/messaging';

const ComposePage: React.FC = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const {
    // Data and state
    messagingUI,
    candidatesAsParticipants,
    companiesAsParticipants,
    usersAsParticipants,
    isLoadingCandidates,
    isLoadingCompanies,
    isLoadingUsers,
    isSendingMessage,
    
    // Actions
    fetchCandidates,
    fetchCompanies,
    fetchUsers,
    addRecipient,
    removeRecipient,
    updateDraftMessage,
    createConversation,
    sendMessage
  } = useDataStore();
  
  const { selectedRecipients, draftMessage } = messagingUI;
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  
  // Fetch data when component mounts
  useEffect(() => {
    if (candidatesAsParticipants.length === 0) {
      fetchCandidates();
    }
    if (companiesAsParticipants.length === 0) {
      fetchCompanies();
    }
    if (usersAsParticipants.length === 0) {
      fetchUsers();
    }
  }, [
    fetchCandidates, fetchCompanies, fetchUsers,
    candidatesAsParticipants.length, companiesAsParticipants.length, usersAsParticipants.length
  ]);
  
  // Reset scheduled time when exiting schedule mode
  useEffect(() => {
    if (!isScheduleMode) {
      setScheduledTime(null);
    } else if (!scheduledTime) {
      // Set default scheduled time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setScheduledTime(defaultTime);
    }
  }, [isScheduleMode]);
  
  // Handler for sending a message
  const handleSendMessage = async (content: string) => {
    if (!user || selectedRecipients.length === 0) return;
    
    try {
      // Create title from recipient names
      const recipientNames = selectedRecipients.map(r => r.name).join(', ');
      const title = selectedRecipients.length > 1 ? `Group: ${recipientNames}` : recipientNames;
      
      // Create conversation data
      const conversationData = {
        title,
        is_group: selectedRecipients.length > 1,
        participants: [
          {
            user_id: parseInt(user.id),
            role: ParticipantRole.ADMIN
          },
          ...selectedRecipients.map(r => ({
            user_id: parseInt(r.id),
            role: ParticipantRole.MEMBER
          }))
        ]
      };
      
      // Create the conversation and get its ID
      const conversation = await createConversation(conversationData);
      
      // Send the initial message
      const messageData = {
        conversation_id: conversation.id,
        sender_id: parseInt(user.id),
        content,
        // Add scheduled time if in schedule mode
        ...(isScheduleMode && scheduledTime 
          ? { scheduled_for: scheduledTime.toISOString() } 
          : {})
      };
      
      await sendMessage(messageData);
      
      // Navigate back to messages
      router.push('/messaging');
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Show error message
    }
  };
  
  // Handler for scheduling a message
  const handleScheduleMessage = async (content: string) => {
    if (!scheduledTime) return;
    await handleSendMessage(content);
  };
  
  // Format time options for the schedule dropdown
  const getTimeOptions = () => {
    const options = [];
    const now = new Date();
    
    // Add options at 1-hour intervals for the next 24 hours
    for (let i = 1; i <= 24; i++) {
      const time = new Date(now);
      time.setHours(time.getHours() + i);
      
      options.push({
        value: time.toISOString(),
        label: time.toLocaleString([], {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      });
    }
    
    return options;
  };
  
  const isLoading = isLoadingCandidates || isLoadingCompanies || isLoadingUsers;
  const canSend = selectedRecipients.length > 0 && draftMessage.trim().length > 0;
  
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.card }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FiArrowLeft />}
            onClick={() => router.push('/messaging')}
          >
            Back
          </Button>
          <h1 className="text-xl font-semibold">New Message</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isScheduleMode ? (
            <div className="flex items-center gap-2">
              <select
                className="py-2 px-3 rounded-md border text-sm"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text
                }}
                value={scheduledTime?.toISOString() || ''}
                onChange={(e) => setScheduledTime(new Date(e.target.value))}
              >
                <option value="" disabled>Select time</option>
                {getTimeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FiClock />}
                disabled={!canSend || !scheduledTime}
                loading={isSendingMessage}
                onClick={() => handleScheduleMessage(draftMessage)}
              >
                Schedule
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsScheduleMode(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiClock />}
              onClick={() => setIsScheduleMode(true)}
              disabled={!canSend}
            >
              Schedule
            </Button>
          )}
          
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FiSend />}
            onClick={() => handleSendMessage(draftMessage)}
            disabled={!canSend || isScheduleMode}
            loading={isSendingMessage}
          >
            Send
          </Button>
        </div>
      </div>
      
      {/* Recipients */}
      <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <label className="block text-sm font-medium mb-1">To:</label>
        <RecipientSelector
          selectedRecipients={selectedRecipients}
          onAddRecipient={addRecipient}
          onRemoveRecipient={removeRecipient}
          placeholder="Add recipients..."
          disabled={isLoading}
        />
      </div>
      
      {/* Message content area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Message:</label>
          <textarea
            className="w-full p-3 border rounded-md min-h-[200px]"
            style={{
              backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
              borderColor: colors.border,
              color: colors.text
            }}
            placeholder="Type your message here..."
            value={draftMessage}
            onChange={(e) => updateDraftMessage(e.target.value)}
          />
        </div>
        
        {/* Optional attachments area */}
        <div>
          <label className="block text-sm font-medium mb-2">Attachments:</label>
          <div 
            className="p-4 border border-dashed rounded-md text-center"
            style={{ 
              borderColor: colors.border,
              backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
            }}
          >
            <button
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md"
              style={{
                backgroundColor: theme === 'light' ? '#EFF6FF' : '#1E3A8A',
                color: theme === 'light' ? '#3B82F6' : '#93C5FD'
              }}
            >
              <FiPaperclip className="w-4 h-4" />
              <span>Add Attachment</span>
            </button>
            <p className="mt-2 text-sm" style={{ color: `${colors.text}80` }}>
              Drag and drop files here or click to select
            </p>
          </div>
        </div>
      </div>
      
      {/* Message composer */}
      <MessageComposer
        onSend={handleSendMessage}
        disabled={selectedRecipients.length === 0}
        initialContent={draftMessage}
        onUpdateContent={updateDraftMessage}
      />
    </div>
  );
};

export default ComposePage;