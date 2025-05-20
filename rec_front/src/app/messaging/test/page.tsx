'use client';

import React from 'react';
import { useMessaging } from '@/app/context/MessagingContext';

const TestMessagingPage: React.FC = () => {
  const { conversations, isLoadingConversations } = useMessaging();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Testing MessagingContext</h1>
      
      {isLoadingConversations ? (
        <p>Loading conversations...</p>
      ) : (
        <div>
          <p>Total conversations: {conversations.length}</p>
          <ul className="mt-4">
            {conversations.map(conversation => (
              <li key={conversation.id} className="mb-2 p-3 border rounded">
                {conversation.title || 'Untitled Conversation'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestMessagingPage;
EOT < /dev/null