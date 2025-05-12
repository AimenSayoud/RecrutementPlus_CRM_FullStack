// src/app/ai-assistant/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import Badge from '@/components/ui/Badge';
import SlashCommandMenu from '@/components/ui/SlashCommandMenu';
import EntitySearchMenu from '@/components/ui/EntitySearchMenu';
import { apiService } from '@/lib';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  generateCandidateEmail,
  generateCompanyEmail,
  generateInterviewQuestions,
  generatePositionInterviewQuestions,
  generateJobDescription,
  generateCandidateFeedback,
  processGeneralQuery
} from '@/lib/openai-service';
import { Candidate, Company } from '@/types';

// Command types
interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

// Message type
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  entityReference?: {
    type: 'candidate' | 'company';
    id: string;
    name: string;
  };
}

// AI Assistant page component
const AiAssistantPage = () => {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with writing emails, generating interview questions, creating job descriptions, and more. Type a message or use slash commands (/) for specific tasks!',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showEntitySearch, setShowEntitySearch] = useState<'candidates' | 'companies' | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Candidate | Company | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch candidates and companies
  const { data: candidates } = useApiQuery<Candidate[]>(
    () => apiService.candidates.getAll(),
    []
  );

  const { data: companies } = useApiQuery<Company[]>(
    () => apiService.companies.getAll(),
    []
  );

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Available slash commands
  const slashCommands: Command[] = [
    {
      id: 'candidates',
      label: 'Search Candidates',
      description: 'Search and select a candidate',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        setShowEntitySearch('candidates');
      },
    },
    {
      id: 'companies',
      label: 'Search Companies',
      description: 'Search and select a company',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        setShowEntitySearch('companies');
      },
    },
    {
      id: 'email',
      label: 'Generate Email',
      description: 'Generate an email template',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        if (selectedEntity) {
          if ('firstName' in selectedEntity) {
            // It's a candidate
            setInput(`Generate an email template for ${selectedEntity.firstName} ${selectedEntity.lastName} to `);
          } else {
            // It's a company
            setInput(`Generate an email template for ${selectedEntity.contactPerson} at ${selectedEntity.name} to `);
          }
        } else {
          setInput('Generate an email template for ');
        }
        textAreaRef.current?.focus();
      },
    },
    {
      id: 'interview',
      label: 'Interview Questions',
      description: 'Generate interview questions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        if (selectedEntity) {
          if ('position' in selectedEntity) {
            // It's a candidate
            setInput(`Generate interview questions for a ${selectedEntity.position} position`);
          } else {
            // It's a company
            setInput(`Generate interview questions for a position at ${selectedEntity.name}`);
          }
        } else {
          setInput('Generate interview questions for ');
        }
        textAreaRef.current?.focus();
      },
    },
    {
      id: 'job',
      label: 'Job Description',
      description: 'Create a job description',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        if (selectedEntity && 'industry' in selectedEntity) {
          // It's a company
          setInput(`Create a job description for a position at ${selectedEntity.name} in the ${selectedEntity.industry} industry`);
        } else {
          setInput('Create a job description for ');
        }
        textAreaRef.current?.focus();
      },
    },
    {
      id: 'feedback',
      label: 'Candidate Feedback',
      description: 'Generate candidate feedback',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      action: () => {
        setShowSlashCommands(false);
        if (selectedEntity && 'firstName' in selectedEntity) {
          // It's a candidate
          setInput(`Generate feedback for ${selectedEntity.firstName} ${selectedEntity.lastName} after their interview`);
        } else {
          setInput('Generate candidate feedback template');
        }
        textAreaRef.current?.focus();
      },
    },
  ];

  // Handle input changes and slash commands
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // Check for slash command
    if (value === '/') {
      setShowSlashCommands(true);
      setSelectedCommandIndex(0);
    } else if (!value.startsWith('/')) {
      setShowSlashCommands(false);
    }
  };

  // Handle selection of a slash command
  const handleCommandSelect = (command: Command) => {
    command.action();
  };

  // Handle selection of an entity (candidate or company)
  const handleEntitySelect = (entity: Candidate | Company) => {
    setSelectedEntity(entity);
    setShowEntitySearch(null);
    
    // Add a message to indicate selection
    const entityType = 'firstName' in entity ? 'candidate' : 'company';
    const entityName = 'firstName' in entity 
      ? `${entity.firstName} ${entity.lastName}`
      : entity.name;
    
    const message: Message = {
      id: Date.now().toString(),
      content: `Selected ${entityType}: ${entityName}`,
      sender: 'user',
      timestamp: new Date(),
      entityReference: {
        type: entityType as 'candidate' | 'company',
        id: entity.id,
        name: entityName,
      },
    };
    
    setMessages(prev => [...prev, message]);
  };

  // Generate AI response
  const generateAIResponse = async (userQuery: string, entityRef?: Message['entityReference']) => {
    try {
      let response: string;
      const lowerQuery = userQuery.toLowerCase();

      // If there's a selected entity
      if (selectedEntity) {
        if ('firstName' in selectedEntity) {
          // Candidate
          const candidate = selectedEntity;
          const fullName = `${candidate.firstName} ${candidate.lastName}`;

          if (lowerQuery.includes('email')) {
            // Generate email for candidate
            response = await generateCandidateEmail(
              candidate,
              lowerQuery.replace(/generate.*email.*for|generate.*email.*(to|about)/i, '').trim(),
              `Current position: ${candidate.position}, Status: ${candidate.status}`
            );
          } else if (lowerQuery.includes('interview question') || lowerQuery.includes('interview preparation')) {
            // Generate interview questions based on candidate position
            response = await generatePositionInterviewQuestions(
              candidate.position,
              undefined,
              `These questions are for a candidate named ${fullName} with status: ${candidate.status}`
            );
          } else if (lowerQuery.includes('feedback')) {
            // Generate feedback for candidate
            response = await generateCandidateFeedback(
              candidate,
              lowerQuery.includes('interview') ? `After interview for ${candidate.position} position` : undefined
            );
          } else {
            // Process general query related to candidate
            response = await processGeneralQuery(userQuery, `This query is related to candidate ${fullName},
              position: ${candidate.position}, status: ${candidate.status}`);
          }
        } else {
          // Company
          const company = selectedEntity;

          if (lowerQuery.includes('email')) {
            // Generate email for company
            response = await generateCompanyEmail(
              company,
              lowerQuery.replace(/generate.*email.*for|generate.*email.*(to|about)/i, '').trim(),
              `Industry: ${company.industry}, Open positions: ${company.openPositions}`
            );
          } else if (lowerQuery.includes('job description')) {
            // Extract position from query or use generic
            const positionMatch = userQuery.match(/job description for (a |an )?(.*?)( position)? at/i);
            const position = positionMatch ? positionMatch[2] : 'new';

            response = await generateJobDescription(
              position,
              company.name,
              company.industry
            );
          } else if (lowerQuery.includes('interview question')) {
            // Extract position from query
            const positionMatch = userQuery.match(/(interview questions|questions) for (a |an )?(.*?)( position)?( at| for)/i);
            const position = positionMatch ? positionMatch[3] : 'candidate';

            response = await generatePositionInterviewQuestions(
              position,
              company.name,
              `For a position at ${company.name} in the ${company.industry} industry`
            );
          } else {
            // Process general query related to company
            response = await processGeneralQuery(userQuery, `This query is related to company ${company.name},
              industry: ${company.industry}, contact: ${company.contactPerson}`);
          }
        }
      } else if (entityRef) {
        // Use entity reference from previous message
        const entity = entityRef.type === 'candidate'
          ? candidates?.find(c => c.id === entityRef.id)
          : companies?.find(c => c.id === entityRef.id);

        if (entity) {
          if (entityRef.type === 'candidate') {
            const candidate = entity as Candidate;
            const fullName = `${candidate.firstName} ${candidate.lastName}`;

            if (lowerQuery.includes('email')) {
              response = await generateCandidateEmail(
                candidate,
                lowerQuery.replace(/generate.*email.*for|generate.*email.*(to|about)/i, '').trim(),
                `Current position: ${candidate.position}, Status: ${candidate.status}`
              );
            } else if (lowerQuery.includes('interview question') || lowerQuery.includes('interview preparation')) {
              response = await generatePositionInterviewQuestions(
                candidate.position,
                undefined,
                `These questions are for a candidate named ${fullName} with status: ${candidate.status}`
              );
            } else if (lowerQuery.includes('feedback')) {
              response = await generateCandidateFeedback(
                candidate,
                lowerQuery.includes('interview') ? `After interview for ${candidate.position} position` : undefined
              );
            } else {
              response = await processGeneralQuery(userQuery, `This query is related to candidate ${fullName},
                position: ${candidate.position}, status: ${candidate.status}`);
            }
          } else {
            const company = entity as Company;

            if (lowerQuery.includes('email')) {
              response = await generateCompanyEmail(
                company,
                lowerQuery.replace(/generate.*email.*for|generate.*email.*(to|about)/i, '').trim(),
                `Industry: ${company.industry}, Open positions: ${company.openPositions}`
              );
            } else if (lowerQuery.includes('job description')) {
              const positionMatch = userQuery.match(/job description for (a |an )?(.*?)( position)? at/i);
              const position = positionMatch ? positionMatch[2] : 'new';

              response = await generateJobDescription(
                position,
                company.name,
                company.industry
              );
            } else if (lowerQuery.includes('interview question')) {
              const positionMatch = userQuery.match(/(interview questions|questions) for (a |an )?(.*?)( position)?( at| for)/i);
              const position = positionMatch ? positionMatch[3] : 'candidate';

              response = await generatePositionInterviewQuestions(
                position,
                company.name,
                `For a position at ${company.name} in the ${company.industry} industry`
              );
            } else {
              response = await processGeneralQuery(userQuery, `This query is related to company ${company.name},
                industry: ${company.industry}, contact: ${company.contactPerson}`);
            }
          }
        } else {
          // Entity not found, process general query
          response = await processGeneralQuery(userQuery);
        }
      } else {
        // No entity selected or referenced

        // Check if this is a request for job description
        if (lowerQuery.includes('job description')) {
          const positionMatch = userQuery.match(/job description for (a |an )?(.*?)( position)?/i);
          const position = positionMatch ? positionMatch[2] : 'new';

          response = await generateJobDescription(
            position,
            'your company',
            undefined,
            'Create a generic job description that can be customized later.'
          );
        }
        // Check if this is a request for interview questions
        else if (lowerQuery.includes('interview question')) {
          const positionMatch = userQuery.match(/(interview questions|questions) for (a |an )?(.*?)( position)?/i);
          const position = positionMatch ? positionMatch[3] : 'candidate';

          response = await generatePositionInterviewQuestions(
            position
          );
        }
        // Handle feedback requests
        else if (lowerQuery.includes('feedback')) {
          response = await processGeneralQuery(
            "Generate a template for candidate feedback after an interview",
            "The user wants a general feedback template that can be customized for specific candidates."
          );
        }
        // Process as general query
        else {
          response = await processGeneralQuery(userQuery);
        }
      }

      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Get the last message for context
    const lastMessage = messages[messages.length - 1];
    const entityRef = lastMessage?.entityReference;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    // Generate AI response
    try {
      const response = await generateAIResponse(input, entityRef);
      
      // Replace loading message with actual response
      setMessages(prev => {
        const updatedMessages = [...prev];
        const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
        
        if (loadingIndex !== -1) {
          updatedMessages[loadingIndex] = {
            id: Date.now().toString(),
            content: response,
            sender: 'assistant',
            timestamp: new Date(),
          };
        }
        
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error handling message:', error);
      
      // Replace loading message with error message
      setMessages(prev => {
        const updatedMessages = [...prev];
        const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
        
        if (loadingIndex !== -1) {
          updatedMessages[loadingIndex] = {
            id: Date.now().toString(),
            content: "I'm sorry, I encountered an error. Please try again later.",
            sender: 'assistant',
            timestamp: new Date(),
          };
        }
        
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev + 1) % slashCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev - 1 + slashCommands.length) % slashCommands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        slashCommands[selectedCommandIndex].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Entity info box component
  const EntityInfoBox = ({ entity }: { entity: Candidate | Company }) => {
    const isCandidate = 'firstName' in entity;
    
    return (
      <div 
        className="mb-4 p-3 rounded-lg"
        style={{ 
          backgroundColor: isCandidate ? `${colors.primary}15` : `${colors.secondary}15`,
          border: `1px solid ${isCandidate ? `${colors.primary}30` : `${colors.secondary}30`}`
        }}
      >
        <div className="flex items-center mb-2">
          <div 
            className={`w-8 h-8 ${isCandidate ? 'rounded-full' : 'rounded-md'} flex items-center justify-center mr-2 text-white font-medium`}
            style={{ 
              backgroundColor: isCandidate ? colors.primary : colors.secondary
            }}
          >
            {isCandidate
              ? `${(entity as Candidate).firstName?.charAt(0) || ''}${(entity as Candidate).lastName?.charAt(0) || ''}`
              : ((entity as Company).name?.charAt(0) || 'C')}
          </div>
          <div>
            <div className="font-medium" style={{ color: colors.text }}>
              {isCandidate
                ? `${(entity as Candidate).firstName || 'Unknown'} ${(entity as Candidate).lastName || 'Candidate'}`
                : ((entity as Company).name || 'Unknown Company')}
              {isCandidate && (entity as Candidate).status && (
                <Badge
                  variant={
                    (entity as Candidate).status === 'hired' ? 'success' :
                    (entity as Candidate).status === 'rejected' ? 'danger' :
                    (entity as Candidate).status === 'offer' ? 'warning' :
                    'primary'
                  }
                  className="ml-2 text-xs"
                >
                  {(entity as Candidate).status}
                </Badge>
              )}
            </div>
            <div className="text-xs" style={{ color: `${colors.text}80` }}>
              {isCandidate
                ? ((entity as Candidate).position || 'No Position')
                : `${(entity as Company).industry || 'No Industry'} • ${typeof (entity as Company).openPositions === 'number' ? (entity as Company).openPositions : 0} open position(s)`}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button 
            size="sm" 
            variant={isCandidate ? "primary" : "secondary"}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            onClick={() => {
              if (isCandidate) {
                const candidate = entity as Candidate;
                setInput(`Generate an email for ${candidate.firstName || 'the candidate'} ${candidate.lastName || ''} to `);
              } else {
                const company = entity as Company;
                setInput(`Generate an email for ${company.contactPerson || 'the contact person'} at ${company.name || 'the company'} to `);
              }
              textAreaRef.current?.focus();
            }}
          >
            Email
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedEntity(null)}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
          AI Assistant
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-13rem)] flex flex-col">
            <div className="flex-grow overflow-y-auto p-4">
              <div className="space-y-4">
                {selectedEntity && <EntityInfoBox entity={selectedEntity} />}
                
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={
                        message.sender === 'user'
                          ? {}
                          : { backgroundColor: `${colors.primary}20`, color: colors.text }
                      }
                    >
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150"></div>
                        </div>
                      ) : (
                        <div className="whitespace-pre-line">{message.content}</div>
                      )}
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : ''
                        }`}
                        style={{ color: message.sender === 'user' ? '' : `${colors.text}99` }}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="border-t p-4 relative" style={{ borderColor: colors.border }}>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <TextArea
                    ref={textAreaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message or use / for commands..."
                    rows={2}
                    fullWidth
                  />
                  
                  {/* Slash Commands Menu */}
                  <SlashCommandMenu
                    isOpen={showSlashCommands}
                    commands={slashCommands}
                    selectedIndex={selectedCommandIndex}
                    onSelect={handleCommandSelect}
                    onClose={() => setShowSlashCommands(false)}
                  />
                  
                  {/* Entity Search Menu */}
                  <EntitySearchMenu
                    isOpen={showEntitySearch !== null}
                    type={showEntitySearch || 'candidates'}
                    entities={showEntitySearch === 'candidates' ? candidates || [] : companies || []}
                    onSelect={handleEntitySelect}
                    onClose={() => setShowEntitySearch(null)}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  variant="primary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </div>
              
              {/* Use slash commands hint */}
              <div className="mt-2 flex justify-center">
                <div 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                    color: `${colors.text}70` 
                  }}
                >
                  <span>Type <span className="font-mono">/</span> for commands</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card title="Quick Actions">
            <div className="space-y-2">
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setInput('Write an email template for inviting a candidate to an interview.');
                  textAreaRef.current?.focus();
                }}
              >
                Email Template
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setInput('Generate interview questions for a frontend developer position.');
                  textAreaRef.current?.focus();
                }}
              >
                Interview Questions
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setInput('Create a job description for a project manager role.');
                  textAreaRef.current?.focus();
                }}
              >
                Job Description
              </Button>
              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  setInput('Write a candidate feedback summary template.');
                  textAreaRef.current?.focus();
                }}
              >
                Feedback Template
              </Button>
            </div>
          </Card>
          
          <Card title="AI Capabilities" className="mt-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Personalized Email Templates</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Role-Specific Interview Questions</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Customized Job Descriptions</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Candidate Feedback Templates</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Candidate Profile Insights</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Company-specific Correspondence</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Context-Aware Responses</span>
              </div>
            </div>
          </Card>

          <Card title="Tips" className="mt-6">
            <div className="space-y-3 text-sm" style={{ color: `${colors.text}90` }}>
              <p>
                <strong>Slash Commands:</strong> Type / to access commands for searching candidates and companies.
              </p>
              <p>
                <strong>Entity Selection:</strong> Select a candidate or company first to create personalized content.
              </p>
              <p>
                <strong>Email Templates:</strong> Ask for specific types of emails, like "invitation" or "follow-up".
              </p>
              <p>
                <strong>Feedback Generation:</strong> Select a candidate first, then ask for feedback for more personalized content.
              </p>
              <p>
                <strong>Context Awareness:</strong> The assistant remembers selected entities for follow-up questions.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;