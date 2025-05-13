// src/app/ai-assistant/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore } from '@/store/useDataStore';
import {
  generateCandidateEmail,
  generateCompanyEmail,
  generatePositionInterviewQuestions,
  generateJobDescriptionService,
  generateCandidateFeedback,
  processGeneralQuery,
  setOpenAIKey,
  analyzeCv,
} from '@/lib/openai-service';
import { Candidate, Company } from '@/types';

// UI Components
import { CommandMenu, CMD_ANALYZE_CV, CMD_GENERATE_EMAIL, CMD_GENERATE_INTERVIEW_QUESTIONS, 
  CMD_GENERATE_JOB_DESCRIPTION, CMD_GENERATE_CANDIDATE_FEEDBACK, CMD_GENERATE_SUGGESTIONS,
  CMD_OPEN_CHAT, CMD_SEARCH_CANDIDATE, CMD_SEARCH_COMPANY } from '@/components/ui/CommandMenu';
import SimpleSearchMenu from '@/components/ui/SimpleSearchMenu';
import ModernAIMessage from '@/components/ui/ModernAIMessage';
import ModernAIInput from '@/components/ui/ModernAIInput';
import ModernEntityCard from '@/components/ui/ModernEntityCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { FiCpu, FiSettings } from 'react-icons/fi';

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

const ApiKeySettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { colors, theme } = useTheme();
  const [apiKeyInput, setApiKeyInput] = useState('');

  const handleSaveKey = () => {
    if (apiKeyInput.trim().startsWith('sk-')) {
      setOpenAIKey(apiKeyInput.trim());
      onClose();
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50 p-4">
      <div
        className="rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        style={{
          background: theme === 'light'
            ? 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
            : 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: theme === 'light' ? '#E2E8F0' : '#334155' }}>
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            OpenAI API Key (Frontend Fallback)
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm mb-4" style={{ color: `${colors.text}90` }}>
            If backend AI services are unavailable, the system might attempt direct OpenAI calls.
            Enter your OpenAI API key here. It will be stored in session storage.
          </p>
          <div className="space-y-1 mb-4">
            <label htmlFor="apiKeyInputModal" className="block text-sm font-medium" style={{ color: colors.text }}>
              API Key
            </label>
            <Input 
              id="apiKeyInputModal" 
              type="password" 
              value={apiKeyInput} 
              onChange={(e) => setApiKeyInput(e.target.value)} 
              placeholder="sk-..." 
              fullWidth 
              className="p-3"
            />
            <p className="text-xs mt-1" style={{ color: `${colors.text}70` }}>
              API keys typically start with &quot;sk-&quot;
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSaveKey} 
              disabled={!apiKeyInput.trim().startsWith('sk-')}
            >
              Save API Key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiAssistantPage = () => {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the Zustand store
  const {
    candidates,
    companies,
    selectedEntity,
    isLoadingCandidates,
    isLoadingCompanies,
    candidatesError,
    companiesError,
    fetchCandidates,
    fetchCompanies,
    setSelectedCandidate,
    setSelectedCompany,
    clearSelectedEntity,
  } = useDataStore();

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'initial-greeting', 
      content: "Hello! I'm your AI assistant. How can I help with your recruitment tasks today? Type '/' for commands.", 
      sender: 'assistant', 
      timestamp: new Date() 
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showCandidateSearch, setShowCandidateSearch] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [commandThatNeedsEntity, setCommandThatNeedsEntity] = useState<string | null>(null);

  // Fetch data when component mounts
  useEffect(() => {
    console.log("🚀 AI Assistant page mounted");
    fetchCandidates(user?.officeId);
    fetchCompanies(user?.officeId);
  }, [fetchCandidates, fetchCompanies, user?.officeId]);

  // Scroll to bottom when messages change
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // Add a message to the chat
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString(), timestamp: new Date() }]);
  };

  // Update the last message in the chat
  const updateLastMessage = (updatedContent: Partial<Message>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = { 
          ...newMessages[newMessages.length - 1], 
          ...updatedContent, 
          isLoading: false 
        };
      }
      return newMessages;
    });
  };

  // Main function to generate AI responses
  const generateAIResponse = async (userQuery: string): Promise<string> => {
    console.log("🤖 Generating AI response for:", userQuery);
    const lowerQuery = userQuery.toLowerCase();

    try {
      // Handle CV Analysis directly if triggered by keyword
      if (lowerQuery.startsWith('analyze cv') || lowerQuery.startsWith('/analyze_cv')) {
        const cvText = userQuery.replace(/analyze cv/i, '').replace(/\/analyze_cv/i, '').trim();
        if (cvText) {
          const analysis = await analyzeCv(cvText);
          
          // Format the response
          let formattedResponse = `✅ **CV Analysis Complete!**\n\n`;
          if (analysis?.summary) formattedResponse += `**Summary:**\n${analysis.summary}\n\n`;
          if (analysis?.total_experience_years !== undefined) {
            formattedResponse += `**Total Experience:** ${analysis.total_experience_years} years\n`;
          }
          if (analysis?.skills && analysis.skills.length > 0) {
            formattedResponse += `**Skills:** ${analysis.skills.join(', ')}\n`;
          }
          if (analysis?.education && analysis.education.length > 0) {
            formattedResponse += `**Education:**\n${analysis.education.map(edu => 
              `  - ${edu.degree || 'N/A'} at ${edu.institution || 'N/A'} (${edu.end_year || 'N/A'})`
            ).join('\n')}\n`;
          }
          if (analysis?.experience && analysis.experience.length > 0) { 
            formattedResponse += `**Experience:**\n${analysis.experience.map(exp => 
              `  - ${exp.title || 'N/A'} at ${exp.company || 'N/A'} (${exp.duration || 'N/A'})`
            ).join('\n')}\n`;
          }
          
          return formattedResponse.trim() || "CV Analyzed, but no specific details extracted.";
        }
        return "It looks like you wanted to analyze a CV, but the text was missing. Please use the format: analyze cv [CV text here]";
      }

      // Handle queries with a selected entity context
      if (selectedEntity) {
        const isCandidate = 'firstName' in selectedEntity;
        const entityName = isCandidate 
          ? `${selectedEntity.firstName} ${selectedEntity.lastName}` 
          : selectedEntity.name;
        
        if (isCandidate) { 
          // Candidate context
          const candidate = selectedEntity as Candidate;
          
          if (lowerQuery.includes('email') || lowerQuery.includes('draft an email')) {
            const purpose = lowerQuery.includes('email for') 
              ? lowerQuery.replace(/.*email for/i, '').trim() 
              : 'general inquiry';
              
            return await generateCandidateEmail(
              candidate, 
              `Regarding: ${purpose}`, 
              `From AI Assistant query: ${userQuery}`
            );
          }
          
          if (lowerQuery.includes('interview questions')) {
            return await generatePositionInterviewQuestions(
              candidate.position, 
              undefined, 
              `For candidate: ${candidate.firstName} ${candidate.lastName}`
            );
          }
          
          if (lowerQuery.includes('feedback')) {
            return await generateCandidateFeedback(candidate);
          }
          
          // Default for candidate context
          return await processGeneralQuery(
            userQuery, 
            `Context: Candidate - ${entityName}, Position: ${candidate.position}`
          );
          
        } else { 
          // Company context
          const company = selectedEntity as Company;
          
          if (lowerQuery.includes('email') || lowerQuery.includes('draft an email')) {
            const purpose = lowerQuery.includes('email for') 
              ? lowerQuery.replace(/.*email for/i, '').trim() 
              : 'general inquiry';
              
            return await generateCompanyEmail(
              company, 
              `Regarding: ${purpose}`, 
              `From AI Assistant query: ${userQuery}`
            );
          }
          
          if (lowerQuery.includes('job description')) {
            const positionMatch = lowerQuery.match(/job description for (?:an? )?(.*?) position/i);
            const position = positionMatch?.[1]?.trim() || 'a suitable role';
            
            return await generateJobDescriptionService(position, company.name, company.industry);
          }
          
          if (lowerQuery.includes('interview questions')) {
            const positionMatch = lowerQuery.match(/interview questions for (?:an? )?(.*?) position/i);
            const position = positionMatch?.[1]?.trim() || 'a role';
            
            return await generatePositionInterviewQuestions(position, company.name);
          }
          
          // Default for company context
          return await processGeneralQuery(
            userQuery, 
            `Context: Company - ${entityName}, Industry: ${company.industry}`
          );
        }
      }

      // Handle generic queries without specific entity context
      if (lowerQuery.includes('job description') || lowerQuery.includes('draft a job description')) {
        const positionMatch = lowerQuery.match(/job description for (?:an? )?(.*?) position/i) || 
                             lowerQuery.match(/draft a job description for (?:an? )?(.*?) position/i);
        const position = positionMatch?.[1]?.trim() || 'a generic role';
        
        return await generateJobDescriptionService(position, 'Your Company (Generic)');
      }
      
      if (lowerQuery.includes('interview questions') || lowerQuery.includes('create interview questions')) {
        const positionMatch = lowerQuery.match(/interview questions for (?:an? )?(.*?) position/i) || 
                             lowerQuery.match(/create interview questions for (?:an? )?(.*?) position/i);
        const position = positionMatch?.[1]?.trim() || 'a generic role';
        
        return await generatePositionInterviewQuestions(position);
      }

      // Default to general query processing
      return await processGeneralQuery(userQuery);

    } catch (error: any) {
      console.error("❌ Error in generateAIResponse:", error);
      return `I encountered an issue processing that: ${error.message || "Please try a different query or check the service."}`;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (query?: string) => {
    const currentQuery = (query || input).trim();
    if (!currentQuery || isProcessing) return;

    // Add user message
    addMessage({ content: currentQuery, sender: 'user' });
    setInput('');
    
    // Show loading state
    setIsProcessing(true);
    addMessage({ content: '', sender: 'assistant', isLoading: true });

    try {
      // Generate response
      const responseContent = await generateAIResponse(currentQuery);
      
      // Update message with response
      updateLastMessage({
        content: responseContent,
        entityReference: selectedEntity ? {
          type: 'firstName' in selectedEntity ? 'candidate' : 'company',
          id: selectedEntity.id,
          name: 'firstName' in selectedEntity
            ? `${selectedEntity.firstName} ${selectedEntity.lastName}`
            : selectedEntity.name,
        } : undefined,
      });
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      updateLastMessage({ 
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Command action handlers
  const handleGenerateGenericJobDescription = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    addMessage({ 
      content: "Generating a generic job description...", 
      sender: 'assistant', 
      isLoading: true 
    });
    
    try {
      const jd = await generateJobDescriptionService("General Position", "Our Company");
      updateLastMessage({ content: jd });
    } catch (error: any) {
      updateLastMessage({ 
        content: `Error generating job description: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateGenericInterviewQuestions = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    addMessage({ 
      content: "Generating generic interview questions...", 
      sender: 'assistant', 
      isLoading: true 
    });
    
    try {
      const questions = await generatePositionInterviewQuestions("General Role");
      updateLastMessage({ content: questions });
    } catch (error: any) {
      updateLastMessage({ 
        content: `Error generating interview questions: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle entity selection
  const handleSelectCandidate = (candidate: Candidate) => {
    console.log("👤 Selected candidate:", candidate.firstName, candidate.lastName);
    setSelectedCandidate(candidate);
    setShowCandidateSearch(false);
    
    const newName = `${candidate.firstName} ${candidate.lastName}`;
    addMessage({ 
      content: `Switched context to candidate: ${newName}. You can now ask questions or generate content related to them.`, 
      sender: 'assistant' 
    });
    
    // Execute pending command if there is one
    if (commandThatNeedsEntity) {
      triggerCommandAction(commandThatNeedsEntity, candidate);
    }
  };

  const handleSelectCompany = (company: Company) => {
    console.log("🏢 Selected company:", company.name);
    setSelectedCompany(company);
    setShowCompanySearch(false);
    
    addMessage({ 
      content: `Switched context to company: ${company.name}. You can now ask questions or generate content related to them.`, 
      sender: 'assistant' 
    });
    
    // Execute pending command if there is one
    if (commandThatNeedsEntity) {
      triggerCommandAction(commandThatNeedsEntity, company);
    }
  };

  // Execute a command with a selected entity
  const triggerCommandAction = async (commandId: string, entity: Candidate | Company) => {
    const entityName = 'firstName' in entity 
      ? `${entity.firstName} ${entity.lastName}` 
      : entity.name;
      
    console.log(`🔄 Executing command: ${commandId} for ${entityName}`);
    
    addMessage({ 
      content: `Okay, I will ${commandId.replace(/_/g, ' ')} for ${entityName}. One moment...`, 
      sender: 'assistant', 
      isLoading: true 
    });
    
    setIsProcessing(true);
    setCommandThatNeedsEntity(null);

    let responseContent = '';
    try {
      switch (commandId) {
        case CMD_GENERATE_EMAIL:
          responseContent = 'firstName' in entity
            ? await generateCandidateEmail(entity as Candidate, "your specific email purpose")
            : await generateCompanyEmail(entity as Company, "your specific email purpose");
          break;
          
        case CMD_GENERATE_SUGGESTIONS:
          responseContent = await processGeneralQuery(
            `Provide 3-5 actionable suggestions for working with ${entityName}.`
          );
          break;
          
        case CMD_GENERATE_CANDIDATE_FEEDBACK:
          if ('firstName' in entity) {
            responseContent = await generateCandidateFeedback(entity as Candidate);
          } else { 
            responseContent = "Feedback generation is specifically for candidates."; 
          }
          break;
          
        case CMD_GENERATE_INTERVIEW_QUESTIONS:
           if ('firstName' in entity) {
             const cand = entity as Candidate;
             responseContent = await generatePositionInterviewQuestions(
               cand.position, 
               undefined, 
               `For candidate ${cand.firstName} ${cand.lastName}`
             );
           } else {
             const comp = entity as Company;
             responseContent = await generatePositionInterviewQuestions(
               "a relevant role", 
               comp.name
             );
           }
          break;
          
        case CMD_GENERATE_JOB_DESCRIPTION:
          if (!('firstName' in entity)) {
            const comp = entity as Company;
            responseContent = await generateJobDescriptionService(
              "a new role", 
              comp.name, 
              comp.industry
            );
          } else { 
            responseContent = "Job description generation is typically for companies. Please select a company or ask for a generic one."; 
          }
          break;
          
        case CMD_OPEN_CHAT:
          responseContent = `Continuing our chat with focus on ${entityName}. What would you like to discuss or do?`;
          break;
          
        default:
          responseContent = `Action for "${commandId}" with entity ${entityName} is not implemented.`;
      }
      
      updateLastMessage({ 
        content: responseContent, 
        entityReference: { 
          type: 'firstName' in entity ? 'candidate' : 'company', 
          id: entity.id, 
          name: entityName 
        } 
      });
    } catch (error: any) {
      console.error(`❌ Error during action "${commandId}":`, error);
      updateLastMessage({ 
        content: `Error during action "${commandId}": ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle command selection and entity requirements
  const handleInitiateEntitySelectionForCommand = (
    entityTypeRequired: 'candidate' | 'company' | 'either' | null,
    commandId: string
  ) => {
    console.log(`🔄 Command initiated: ${commandId}, requires: ${entityTypeRequired}`);
    setShowCommandMenu(false); 

    // Handle commands that don't require entities
    if (entityTypeRequired === null) {
      if (commandId === CMD_ANALYZE_CV) {
        addMessage({ 
          content: "Understood. Please paste the CV text in the input field below and send it for analysis.", 
          sender: 'assistant' 
        });
        return; 
      }
      
      if (commandId === CMD_GENERATE_JOB_DESCRIPTION) {
        addMessage({ 
          content: "Okay, generating a generic job description template.", 
          sender: 'assistant' 
        });
        handleGenerateGenericJobDescription();
        return;
      }
      
      if (commandId === CMD_GENERATE_INTERVIEW_QUESTIONS) {
        addMessage({ 
          content: "Okay, generating generic interview questions.", 
          sender: 'assistant' 
        });
        handleGenerateGenericInterviewQuestions();
        return;
      }
      
      if(commandId === CMD_OPEN_CHAT && !selectedEntity) {
        addMessage({ 
          content: "You can ask general questions, or use /search_candidate or /search_company to set a context.", 
          sender: 'assistant'
        });
        return;
      }
    }
    
    // Remember command for after entity selection
    setCommandThatNeedsEntity(commandId); 

    // Check if we already have the required entity selected
    if (selectedEntity) {
      const currentEntityType = 'firstName' in selectedEntity ? 'candidate' : 'company';
      
      if (entityTypeRequired === 'either' || entityTypeRequired === currentEntityType) {
        triggerCommandAction(commandId, selectedEntity);
        return;
      } else {
        addMessage({ 
          content: `This command needs a ${entityTypeRequired}. You currently have a ${currentEntityType} selected. Please select a ${entityTypeRequired}.`, 
          sender: 'assistant' 
        });
        
        if (entityTypeRequired === 'candidate') {
          setShowCandidateSearch(true);
        } else if (entityTypeRequired === 'company') {
          setShowCompanySearch(true);
        }
        return;
      }
    }
    
    // No entity selected, prompt for selection
    if (entityTypeRequired === 'candidate') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a candidate first.`, 
        sender: 'assistant' 
      });
      setShowCandidateSearch(true);
    } else if (entityTypeRequired === 'company') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a company first.`, 
        sender: 'assistant' 
      });
      setShowCompanySearch(true);
    } else if (entityTypeRequired === 'either') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a candidate or a company. Starting with candidate search.`, 
        sender: 'assistant' 
      });
      setShowCandidateSearch(true);
    }
  };

  // Input handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSlashCommand = () => {
    console.log("🔄 Slash command initiated");
    setShowCommandMenu(true);
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme === 'light' ? '#F8FAFC' : '#0F172A' }}>
      {/* API Key Modal */}
      <ApiKeySettingsModal isOpen={showApiKeySettings} onClose={() => setShowApiKeySettings(false)} />

      {/* Command Menu */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => setShowCommandMenu(false)}
        onSelectCandidate={handleSelectCandidate} 
        onSelectCompany={handleSelectCompany}   
        onInitiateEntitySelection={handleInitiateEntitySelectionForCommand}
        selectedEntity={selectedEntity}
      />

      {/* Search Modals */}
      <SimpleSearchMenu
        isOpen={showCandidateSearch}
        type="candidates"
        items={candidates}
        isLoading={isLoadingCandidates}
        error={candidatesError}
        onSelect={(item) => { 
          if ('firstName' in item) handleSelectCandidate(item as Candidate); 
        }}
        onClose={() => {
          setShowCandidateSearch(false);
          if(commandThatNeedsEntity && !selectedEntity) {
            addMessage({ 
              content: `Action "${commandThatNeedsEntity.replace(/_/g, ' ')}" cancelled as no candidate was selected.`, 
              sender: 'assistant' 
            });
            setCommandThatNeedsEntity(null);
          }
        }}
        title="Select a Candidate to Set Context"
      />
      
      <SimpleSearchMenu
        isOpen={showCompanySearch}
        type="companies"
        items={companies}
        isLoading={isLoadingCompanies}
        error={companiesError}
        onSelect={(item) => { 
          if (!('firstName' in item)) handleSelectCompany(item as Company); 
        }}
        onClose={() => {
          setShowCompanySearch(false);
          if(commandThatNeedsEntity && !selectedEntity) {
            addMessage({ 
              content: `Action "${commandThatNeedsEntity.replace(/_/g, ' ')}" cancelled as no company was selected.`, 
              sender: 'assistant' 
            });
            setCommandThatNeedsEntity(null);
          }
        }}
        title="Select a Company to Set Context"
      />

      {/* Main Chat Interface */}
      <div className="flex flex-col h-full w-full overflow-hidden" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 z-20" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1E293B',
          borderColor: theme === 'light' ? '#E2E8F0' : '#334155',
          boxShadow: theme === 'light' ? '0 1px 3px rgba(0, 0, 0, 0.05)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="flex items-center">
            <div className="mr-3 h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <FiCpu className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>AI Assistant</h1>
          </div>
          {selectedEntity ? (
            <ModernEntityCard 
              entity={selectedEntity} 
              onClear={() => {
                clearSelectedEntity();
                addMessage({
                  content: "Context cleared. You can now ask general questions or select a new entity.", 
                  sender: 'assistant'
                });
              }} 
            />
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowApiKeySettings(true)}
              className="text-sm"
              leftIcon={<FiSettings />}
            >
              API Settings
            </Button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 overflow-hidden p-4">
          <div className="flex flex-col flex-1 max-h-full rounded-xl overflow-hidden border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                  >
                    <ModernAIMessage
                      id={message.id}
                      content={message.content}
                      sender={message.sender}
                      timestamp={message.timestamp}
                      isLoading={message.isLoading}
                      entityReference={message.entityReference}
                      isLast={index === messages.length - 1}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <ModernAIInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onSend={() => handleSendMessage()}
                onSlashCommand={handleSlashCommand}
                placeholder={selectedEntity
                  ? `Ask about ${'firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name}... or type /`
                  : "Type / for commands or ask a general question..."}
                disabled={isProcessing}
                entityName={selectedEntity ? ('firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name) : null}
                entityType={selectedEntity ? ('firstName' in selectedEntity ? 'candidate' : 'company') : null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;