'use client';

import React, { useState, useEffect } from 'react';
import RecipientSelector from '@/components/messaging/RecipientSelector';
import { useDataStore } from '@/store/useDataStore';
import { UIParticipant } from '@/types';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';

const TestComponent: React.FC = () => {
  const { colors, theme } = useTheme();
  const { 
    fetchCandidates, 
    fetchCompanies, 
    fetchUsers,
    candidatesAsParticipants,
    companiesAsParticipants,
    usersAsParticipants,
    isLoadingCandidates,
    isLoadingCompanies,
    isLoadingUsers
  } = useDataStore();
  
  const [selectedRecipients, setSelectedRecipients] = useState<UIParticipant[]>([]);
  
  // Fetch data on component mount
  useEffect(() => {
    fetchCandidates();
    fetchCompanies();
    fetchUsers();
  }, [fetchCandidates, fetchCompanies, fetchUsers]);
  
  const handleAddRecipient = (recipient: UIParticipant) => {
    setSelectedRecipients(prev => {
      if (prev.some(r => r.id === recipient.id)) {
        return prev;
      }
      return [...prev, recipient];
    });
  };
  
  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== recipientId));
  };
  
  return (
    <div className="p-8 max-w-3xl mx-auto" style={{ backgroundColor: colors.background }}>
      <h1 className="text-2xl font-semibold mb-6">RecipientSelector Test</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Select Recipients:</h2>
        <RecipientSelector
          selectedRecipients={selectedRecipients}
          onAddRecipient={handleAddRecipient}
          onRemoveRecipient={handleRemoveRecipient}
          placeholder="Add recipients..."
          allowedTypes={['candidate', 'employer', 'admin', 'consultant']}
        />
      </div>
      
      <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-medium mb-4">Selected Recipients:</h2>
        {selectedRecipients.length === 0 ? (
          <p style={{ color: `${colors.text}80` }}>No recipients selected</p>
        ) : (
          <div className="space-y-2">
            {selectedRecipients.map(recipient => (
              <div 
                key={recipient.id} 
                className="p-3 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: theme === 'light' ? '#F3F4F6' : '#374151' }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: theme === 'light' 
                        ? recipient.type === 'candidate' ? '#60A5FA30' 
                        : recipient.type === 'employer' ? '#F9731630'
                        : recipient.type === 'admin' ? '#8B5CF630'
                        : '#F59E0B30'
                        : recipient.type === 'candidate' ? '#60A5FA50' 
                        : recipient.type === 'employer' ? '#F9731650'
                        : recipient.type === 'admin' ? '#8B5CF650'
                        : '#F59E0B50'
                    }}
                  >
                    {recipient.type === 'candidate' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {recipient.type === 'employer' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {recipient.type === 'admin' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {recipient.type === 'consultant' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-xs capitalize" style={{ color: `${colors.text}80` }}>{recipient.type}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRecipient(recipient.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
          <h3 className="font-medium mb-2">Candidates</h3>
          {isLoadingCandidates ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <p>{candidatesAsParticipants.length} candidates loaded</p>
          )}
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
          <h3 className="font-medium mb-2">Companies</h3>
          {isLoadingCompanies ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <p>{companiesAsParticipants.length} companies loaded</p>
          )}
        </div>
        
        <div className="p-4 rounded-lg border" style={{ borderColor: colors.border }}>
          <h3 className="font-medium mb-2">Users</h3>
          {isLoadingUsers ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <p>{usersAsParticipants.length} users loaded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestComponent;