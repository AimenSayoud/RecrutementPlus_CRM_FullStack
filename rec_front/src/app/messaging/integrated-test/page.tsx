'use client';

import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/useDataStore';
import { useTheme } from '@/app/context/ThemeContext';
import RecipientSelector from '@/components/messaging/RecipientSelector';
import MessageComposer from '@/components/messaging/MessageComposer';
import Button from '@/components/ui/Button';

export default function IntegratedTestPage() {
  const { colors, theme } = useTheme();
  const {
    // Data
    candidatesAsParticipants,
    companiesAsParticipants,
    usersAsParticipants,
    
    // Loading states
    isLoadingCandidates,
    isLoadingCompanies,
    isLoadingUsers,
    
    // Actions
    fetchCandidates,
    fetchCompanies,
    fetchUsers,
    messagingUI,
    addRecipient,
    removeRecipient,
    updateDraftMessage
  } = useDataStore();
  
  const [messageContent, setMessageContent] = useState('');
  const { selectedRecipients } = messagingUI;
  
  const isLoading = isLoadingCandidates || isLoadingCompanies || isLoadingUsers;
  
  // Fetch data on component mount
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
  
  // Handler for sending a message
  const handleSendMessage = async (content: string) => {
    if (selectedRecipients.length === 0 || !content.trim()) return;
    
    console.log('Message sent:', {
      to: selectedRecipients.map(r => r.name).join(', '),
      content
    });
    
    // Clear the message content
    setMessageContent('');
    updateDraftMessage('');
    
    // Show a success alert (in a real app, you would update the UI in a more elegant way)
    alert('Message sent successfully!');
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto" style={{ backgroundColor: colors.background }}>
      <h1 className="text-2xl font-semibold mb-6">Integrated Messaging Test</h1>
      
      <div className="mb-8">
        <p className="text-sm mb-4" style={{ color: `${colors.text}80` }}>
          This page demonstrates how the RecipientSelector and MessageComposer components work 
          together with the Zustand store for messaging functionality.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              Candidates
              {isLoadingCandidates && (
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></span>
              )}
            </h3>
            <p>{candidatesAsParticipants.length} loaded</p>
          </div>
          
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              Companies
              {isLoadingCompanies && (
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></span>
              )}
            </h3>
            <p>{companiesAsParticipants.length} loaded</p>
          </div>
          
          <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              Users
              {isLoadingUsers && (
                <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></span>
              )}
            </h3>
            <p>{usersAsParticipants.length} loaded</p>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
          <h2 className="text-lg font-medium">New Message</h2>
        </div>
        
        {/* Recipients */}
        <div className="p-4 border-b" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
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
        <div className="p-4" style={{ backgroundColor: colors.card }}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Message:</label>
            <textarea
              className="w-full p-3 border rounded-md min-h-[100px]"
              style={{
                backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
                borderColor: colors.border,
                color: colors.text
              }}
              placeholder="Type your message here..."
              value={messagingUI.draftMessage}
              onChange={(e) => updateDraftMessage(e.target.value)}
            />
          </div>
        </div>
        
        {/* Message composer */}
        <MessageComposer
          onSend={handleSendMessage}
          disabled={selectedRecipients.length === 0}
          initialContent={messagingUI.draftMessage}
          onUpdateContent={updateDraftMessage}
        />
      </div>
      
      {/* Debug Panel */}
      <div className="mt-8 p-4 border rounded-lg" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
        <h3 className="text-lg font-medium mb-4">Debug Panel</h3>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Selected Recipients:</h4>
          {selectedRecipients.length === 0 ? (
            <p style={{ color: `${colors.text}80` }}>None selected</p>
          ) : (
            <pre className="p-2 rounded-lg" style={{ 
              backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
              color: colors.text,
              maxHeight: '100px',
              overflow: 'auto'
            }}>
              {JSON.stringify(selectedRecipients, null, 2)}
            </pre>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Draft Message:</h4>
          <pre className="p-2 rounded-lg" style={{ 
            backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151',
            color: colors.text,
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {messagingUI.draftMessage || 'No message content'}
          </pre>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="primary"
            onClick={handleSendMessage.bind(null, messagingUI.draftMessage)}
            disabled={selectedRecipients.length === 0 || !messagingUI.draftMessage.trim()}
          >
            Test Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}