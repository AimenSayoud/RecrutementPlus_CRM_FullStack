// src/app/ai-assistant/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { motion } from 'framer-motion';
import { apiService } from '@/lib';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  generateCandidateEmail,
  generateCompanyEmail,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateInterviewQuestions,
  generatePositionInterviewQuestions,
  generateJobDescription,
  generateCandidateFeedback,
  processGeneralQuery,
  setOpenAIKey
} from '@/lib/openai-service';
import { Candidate, Company } from '@/types';
import { CommandMenu } from '@/components/ui/CommandMenu';
import SimpleSearchMenu from '@/components/ui/SimpleSearchMenu';
import ModernAIMessage from '@/components/ui/ModernAIMessage';
import ModernAIInput from '@/components/ui/ModernAIInput';
import ModernEntityCard from '@/components/ui/ModernEntityCard';

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

// Command interface
interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// API Key Settings Modal Component
const ApiKeySettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { colors, theme } = useTheme();
  const [apiKey, setApiKey] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50">
      <motion.div
        className="rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          background: theme === 'light'
            ? 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
            : 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
          boxShadow: theme === 'light'
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: theme === 'light' ? '#E2E8F0' : '#334155' }}>
          <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            OpenAI API Key Settings
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm mb-4" style={{ color: `${colors.text}90` }}>
            Enter your OpenAI API key to enable AI features. This key will be stored securely in your browser&apos;s session storage and won&apos;t be sent to our servers.
          </p>
          
          <div className="space-y-1 mb-4">
            <label className="block text-sm font-medium" style={{ color: colors.text }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              style={{ 
                backgroundColor: theme === 'light' ? '#F8FAFC' : '#0F172A',
                color: colors.text,
                borderColor: theme === 'light' ? '#CBD5E1' : '#334155'
              }}
            />
            <p className="text-xs mt-1" style={{ color: `${colors.text}70` }}>
              API keys start with &quot;sk-&quot;
            </p>
          </div>
          
          {/* Footer with buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{ 
                borderColor: theme === 'light' ? '#CBD5E1' : '#334155',
                color: theme === 'light' ? '#64748B' : '#94A3B8',
                backgroundColor: theme === 'light' ? '#F8FAFC' : '#1E293B'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (apiKey.trim()) {
                  setOpenAIKey(apiKey.trim());
                }
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
              style={{ 
                background: 'linear-gradient(to right, #3B82F6, #4F46E5)',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
              }}
              disabled={!apiKey.trim().startsWith('sk-')}
            >
              Save API Key
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// AI Assistant page component
const AiAssistantPage = () => {
  const { colors, theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with writing emails, generating interview questions, creating job descriptions, and more. To use advanced AI features, please configure your OpenAI API key in the settings.',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showCandidateSearch, setShowCandidateSearch] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Candidate | Company | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [templateType, setTemplateType] = useState<string | null>(null);
  const [initialCommand, setInitialCommand] = useState<'search_candidate' | 'search_company' | null>(null);

  // Fetch candidates and companies with error handling and fallbacks
  const { data: candidates, error: candidatesError } = useApiQuery<Candidate[]>(
    () => apiService.candidates.getAll(),
    []
  );

  const { data: companies, error: companiesError } = useApiQuery<Company[]>(
    () => apiService.companies.getAll(),
    []
  );

  // Create fallback data if API calls fail
  const fallbackCandidates: Candidate[] = !candidates && candidatesError ? [
    {
      id: 'cand-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33612345678',
      position: 'Frontend Developer',
      status: 'interview',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['JavaScript', 'React'],
      rating: 4,
      officeId: '1'
    },
    {
      id: 'cand-2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '+1987654321',
      position: 'UX Designer',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['UI/UX', 'Figma'],
      rating: 3,
      officeId: '1'
    }
  ] : [];

  const fallbackCompanies: Company[] = !companies && companiesError ? [
    {
      id: 'comp-1',
      name: 'TechCorp',
      industry: 'Technology',
      contactPerson: 'James Wilson',
      contactEmail: 'james@techcorp.com',
      contactPhone: '+1122334455',
      createdAt: new Date(),
      updatedAt: new Date(),
      openPositions: 3,
      officeId: '1'
    },
    {
      id: 'comp-2',
      name: 'Marketing Solutions',
      industry: 'Marketing',
      contactPerson: 'Emma Davis',
      contactEmail: 'emma@marketingsolutions.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      openPositions: 2,
      officeId: '1'
    }
  ] : [];

  // Use actual data or fallbacks
  const candidateData = candidates || fallbackCandidates;
  const companyData = companies || fallbackCompanies;

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Available commands
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const availableCommands: Command[] = [
    {
      id: 'search',
      label: 'Search',
      description: 'Find candidates or companies',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'email',
      label: 'Email Template',
      description: 'Generate email templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'interview',
      label: 'Interview Questions',
      description: 'Create interview questions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'job',
      label: 'Job Description',
      description: 'Create job descriptions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'suggestions',
      label: 'Suggestions',
      description: 'Get personalized suggestions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  ];

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
  };

  // Handle selection of a candidate
  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedEntity(candidate);
    
    // Add a message to indicate selection
    const message: Message = {
      id: Date.now().toString(),
      content: `Selected candidate: ${candidate.firstName} ${candidate.lastName}`,
      sender: 'user',
      timestamp: new Date(),
      entityReference: {
        type: 'candidate',
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
      },
    };
    
    setMessages(prev => [...prev, message]);
    
    // If we're in the process of generating a template, continue with that
    if (templateType) {
      generateTemplateForEntity(templateType, candidate);
      setTemplateType(null);
    }
  };

  // Handle selection of a company
  const handleSelectCompany = (company: Company) => {
    setSelectedEntity(company);
    
    // Add a message to indicate selection
    const message: Message = {
      id: Date.now().toString(),
      content: `Selected company: ${company.name}`,
      sender: 'user',
      timestamp: new Date(),
      entityReference: {
        type: 'company',
        id: company.id,
        name: company.name,
      },
    };
    
    setMessages(prev => [...prev, message]);
    
    // If we're in the process of generating a template, continue with that
    if (templateType) {
      generateTemplateForEntity(templateType, company);
      setTemplateType(null);
    }
  };

  // Generate template based on the selected entity
  const generateTemplateForEntity = async (template: string, entity = selectedEntity) => {
    if (!entity) return;
    
    setIsGeneratingTemplate(true);
    
    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      let response: string;
      
      if ('firstName' in entity) {
        // It's a candidate
        const candidate = entity as Candidate;
        
        if (template === 'email') {
          response = await generateCandidateEmail(
            candidate,
            'introduce our services',
            `Candidate Position: ${candidate.position}, Status: ${candidate.status}`
          );
        } else if (template === 'suggestions') {
          try {
            response = await processGeneralQuery(
              `Generate 3-5 suggestions for working with candidate ${candidate.firstName} ${candidate.lastName} who has position ${candidate.position} and is currently in ${candidate.status} status.`,
              `Be specific and provide actionable suggestions based on the candidate's profile.`
            );
          } catch (error) {
            console.error("Error generating suggestions:", error);
            // Fallback suggestion if API fails
            response = `Here are some suggestions for working with ${candidate.firstName} ${candidate.lastName}:

1. Schedule a follow-up interview to discuss their experience in ${candidate.position} roles
2. Ask for portfolio samples relevant to their current status (${candidate.status})
3. Connect them with team members in similar roles for a technical assessment
4. Provide feedback on their application status regularly
5. Share industry insights and company culture information to maintain engagement`;
          }
        } else {
          response = await processGeneralQuery(
            `What should I know about working with ${candidate.firstName} ${candidate.lastName}?`,
            `Candidate position: ${candidate.position}, Status: ${candidate.status}`
          );
        }
      } else {
        // It's a company
        const company = entity as Company;
        
        if (template === 'email') {
          response = await generateCompanyEmail(
            company,
            'introduce our recruitment services',
            `Company Industry: ${company.industry}, Open Positions: ${company.openPositions}`
          );
        } else if (template === 'suggestions') {
          try {
            response = await processGeneralQuery(
              `Generate 3-5 suggestions for working with ${company.name} in the ${company.industry} industry with ${company.openPositions} open positions.`,
              `Be specific and provide actionable suggestions based on the company's profile.`
            );
          } catch (error) {
            console.error("Error generating suggestions:", error);
            // Fallback suggestion if API fails
            response = `Here are some suggestions for working with ${company.name}:

1. Research their current market position in the ${company.industry} industry
2. Prepare a tailored recruitment strategy for their ${company.openPositions} open positions
3. Identify candidates with industry-specific experience in ${company.industry}
4. Schedule a meeting with ${company.contactPerson} to discuss hiring priorities
5. Create a custom talent pipeline aligned with their industry requirements`;
          }
        } else {
          response = await processGeneralQuery(
            `What should I know about working with ${company.name}?`,
            `Company Industry: ${company.industry}, Contact Person: ${company.contactPerson}`
          );
        }
      }

      // Add signature to email templates
      if (template === 'email') {
        const userFullName = user?.name || 'Recruitment Consultant';
        const userRole = user?.role === 'admin' ? 'Recruitment Manager' : 
                         user?.role === 'super_admin' ? 'Senior Recruitment Manager' : 
                         'Recruitment Consultant';
        
        response += `\n\nBest regards,\n${userFullName}\n${userRole}\nRecruitment Plus Team\ncontact@recruitmentplus.com | +1 (555) 123-4567`;
      }
      
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
            entityReference: {
              type: 'firstName' in entity ? 'candidate' : 'company',
              id: entity.id,
              name: 'firstName' in entity 
                ? `${(entity as Candidate).firstName} ${(entity as Candidate).lastName}`
                : (entity as Company).name,
            },
          };
        }
        
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error generating template:', error);
      
      // Replace loading message with error message
      setMessages(prev => {
        const updatedMessages = [...prev];
        const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
        
        if (loadingIndex !== -1) {
          updatedMessages[loadingIndex] = {
            id: Date.now().toString(),
            content: "I'm sorry, I encountered an error generating your template. Please try again.",
            sender: 'assistant',
            timestamp: new Date(),
          };
        }
        
        return updatedMessages;
      });
    } finally {
      setIsGeneratingTemplate(false);
    }
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
            
            // Add signature
            const userFullName = user?.name || 'Recruitment Consultant';
            const userRole = user?.role === 'admin' ? 'Recruitment Manager' : 
                           user?.role === 'super_admin' ? 'Senior Recruitment Manager' : 
                           'Recruitment Consultant';
            
            response += `\n\nBest regards,\n${userFullName}\n${userRole}\nRecruitment Plus Team\ncontact@recruitmentplus.com | +1 (555) 123-4567`;
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
            
            // Add signature
            const userFullName = user?.name || 'Recruitment Consultant';
            const userRole = user?.role === 'admin' ? 'Recruitment Manager' : 
                           user?.role === 'super_admin' ? 'Senior Recruitment Manager' : 
                           'Recruitment Consultant';
            
            response += `\n\nBest regards,\n${userFullName}\n${userRole}\nRecruitment Plus Team\ncontact@recruitmentplus.com | +1 (555) 123-4567`;
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
          ? candidateData.find(c => c.id === entityRef.id)
          : companyData.find(c => c.id === entityRef.id);

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
              
              // Add signature
              const userFullName = user?.name || 'Recruitment Consultant';
              const userRole = user?.role === 'admin' ? 'Recruitment Manager' : 
                               user?.role === 'super_admin' ? 'Senior Recruitment Manager' : 
                               'Recruitment Consultant';
              
              response += `\n\nBest regards,\n${userFullName}\n${userRole}\nRecruitment Plus Team\ncontact@recruitmentplus.com | +1 (555) 123-4567`;
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
              
              // Add signature
              const userFullName = user?.name || 'Recruitment Consultant';
              const userRole = user?.role === 'admin' ? 'Recruitment Manager' : 
                               user?.role === 'super_admin' ? 'Senior Recruitment Manager' : 
                               'Recruitment Consultant';
              
              response += `\n\nBest regards,\n${userFullName}\n${userRole}\nRecruitment Plus Team\ncontact@recruitmentplus.com | +1 (555) 123-4567`;
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
            entityReference: selectedEntity ? {
              type: 'firstName' in selectedEntity ? 'candidate' : 'company',
              id: selectedEntity.id,
              name: 'firstName' in selectedEntity 
                ? `${(selectedEntity as Candidate).firstName} ${(selectedEntity as Candidate).lastName}`
                : (selectedEntity as Company).name,
            } : undefined
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle command click - improved to directly generate content when an entity is selected
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCommandClick = (commandId: string) => {
    // If no entity is selected for commands that need one, show an alert message
    const needsEntity = ['email', 'suggestions'].includes(commandId);
    
    if (needsEntity && !selectedEntity) {
      // Add an assistant message explaining the need to select an entity first
      const helpMessage: Message = {
        id: Date.now().toString(),
        content: `Please select a ${commandId === 'email' ? 'candidate or company' : 'candidate or company'} first to generate ${commandId}.`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, helpMessage]);
      return;
    }
    
    switch (commandId) {
      case 'search':
        setShowCommandMenu(true);
        setInitialCommand(null);
        break;
        
      case 'email':
        if (selectedEntity) {
          generateTemplateForEntity('email');
        }
        break;
        
      case 'interview':
        if (selectedEntity && 'firstName' in selectedEntity) {
          // For candidates, generate directly based on their position
          const candidate = selectedEntity as Candidate;
          const loadingMessage: Message = {
            id: Date.now().toString(),
            content: '',
            sender: 'assistant',
            timestamp: new Date(),
            isLoading: true,
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          generatePositionInterviewQuestions(
            candidate.position || 'candidate',
            undefined,
            `These questions are for ${candidate.firstName} ${candidate.lastName}`
          ).then(response => {
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: response,
                  sender: 'assistant',
                  timestamp: new Date(),
                  entityReference: {
                    type: 'candidate',
                    id: candidate.id,
                    name: `${candidate.firstName} ${candidate.lastName}`,
                  },
                };
              }
              
              return updatedMessages;
            });
          }).catch(error => {
            console.error('Error generating interview questions:', error);
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: "Sorry, I couldn't generate interview questions. Please try again later.",
                  sender: 'assistant',
                  timestamp: new Date(),
                };
              }
              
              return updatedMessages;
            });
          });
        } else if (selectedEntity) {
          // For companies
          const company = selectedEntity as Company;
          const loadingMessage: Message = {
            id: Date.now().toString(),
            content: '',
            sender: 'assistant',
            timestamp: new Date(),
            isLoading: true,
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          generatePositionInterviewQuestions(
            "candidate", // Default position
            company.name,
            `These questions are for candidates applying to ${company.name}`
          ).then(response => {
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: response,
                  sender: 'assistant',
                  timestamp: new Date(),
                  entityReference: {
                    type: 'company',
                    id: company.id,
                    name: company.name,
                  },
                };
              }
              
              return updatedMessages;
            });
          }).catch(error => {
            console.error('Error generating interview questions:', error);
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: "Sorry, I couldn't generate interview questions. Please try again later.",
                  sender: 'assistant',
                  timestamp: new Date(),
                };
              }
              
              return updatedMessages;
            });
          });
        } else {
          // No entity selected - ask user to select one
          const helpMessage: Message = {
            id: Date.now().toString(),
            content: `Please select a candidate or company first to generate interview questions.`,
            sender: 'assistant',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, helpMessage]);
        }
        break;
        
      case 'job':
        if (selectedEntity && !('firstName' in selectedEntity)) {
          // For companies, generate directly
          const company = selectedEntity as Company;
          const loadingMessage: Message = {
            id: Date.now().toString(),
            content: '',
            sender: 'assistant',
            timestamp: new Date(),
            isLoading: true,
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          generateJobDescription(
            "position", // Default position
            company.name,
            company.industry
          ).then(response => {
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: response,
                  sender: 'assistant',
                  timestamp: new Date(),
                  entityReference: {
                    type: 'company',
                    id: company.id,
                    name: company.name,
                  },
                };
              }
              
              return updatedMessages;
            });
          }).catch(error => {
            console.error('Error generating job description:', error);
            setMessages(prev => {
              const updatedMessages = [...prev];
              const loadingIndex = updatedMessages.findIndex(msg => msg.isLoading);
              
              if (loadingIndex !== -1) {
                updatedMessages[loadingIndex] = {
                  id: Date.now().toString(),
                  content: "Sorry, I couldn't generate a job description. Please try again later.",
                  sender: 'assistant',
                  timestamp: new Date(),
                };
              }
              
              return updatedMessages;
            });
          });
        } else {
          // For candidates or no entity, show a message
          const helpMessage: Message = {
            id: Date.now().toString(),
            content: `Please select a company to generate a job description.`,
            sender: 'assistant',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, helpMessage]);
        }
        break;
        
      case 'suggestions':
        if (selectedEntity) {
          generateTemplateForEntity('suggestions');
        }
        break;
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ 
      backgroundColor: theme === 'light' ? '#F8FAFC' : '#0F172A'
    }}>
      {/* API Key Settings Modal */}
      <ApiKeySettingsModal 
        isOpen={showApiKeySettings} 
        onClose={() => setShowApiKeySettings(false)} 
      />
      
      {/* Command Menu */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => {
          setShowCommandMenu(false);
          if (templateType && selectedEntity) {
            setTimeout(() => {
              generateTemplateForEntity(templateType, selectedEntity);
              setTemplateType(null);
            }, 500);
          }
        }}
        onSelectCandidate={handleSelectCandidate}
        onSelectCompany={handleSelectCompany}
        candidates={candidateData}
        companies={companyData}
        initialCommand={initialCommand}
        selectedEntity={selectedEntity}
      />

      {/* Simple Search Menus */}
      <SimpleSearchMenu
        isOpen={showCandidateSearch}
        type="candidates"
        items={candidateData}
        onSelect={(candidate) => {
          setShowCandidateSearch(false);
          handleSelectCandidate(candidate as Candidate);
        }}
        onClose={() => setShowCandidateSearch(false)}
      />

      <SimpleSearchMenu
        isOpen={showCompanySearch}
        type="companies"
        items={companyData}
        onSelect={(company) => {
          setShowCompanySearch(false);
          handleSelectCompany(company as Company);
        }}
        onClose={() => setShowCompanySearch(false)}
      />

      {/* Main Container */}
      <div className="flex flex-col h-full w-full overflow-hidden" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1E293B',
          borderColor: theme === 'light' ? '#E2E8F0' : '#334155',
          boxShadow: theme === 'light' 
            ? '0 1px 3px rgba(0, 0, 0, 0.05)' 
            : '0 1px 3px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="flex items-center">
            <div className="mr-3 h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
              AI Assistant
            </h1>
          </div>

          {/* Entity card or settings button */}
          {selectedEntity ? (
            <ModernEntityCard entity={selectedEntity} onClear={() => setSelectedEntity(null)} />
          ) : (
            <button
              onClick={() => setShowApiKeySettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                backgroundColor: `${colors.primary}10`,
                color: colors.primary,
                borderColor: `${colors.primary}30`,
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>API Settings</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden p-4">
          {/* Chat container */}
          <div className="flex flex-col flex-1 max-h-full rounded-xl overflow-hidden border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <ModernAIInput
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onSend={handleSendMessage}
                onSlashCommand={() => {
                  setShowCommandMenu(true);
                }}
                placeholder={selectedEntity
                  ? `Ask about ${('firstName' in selectedEntity)
                    ? selectedEntity.firstName + ' ' + selectedEntity.lastName
                    : selectedEntity.name}...`
                  : "Type / for commands or start typing..."}
                disabled={isLoading || isGeneratingTemplate}
                entityName={selectedEntity
                  ? 'firstName' in selectedEntity
                    ? `${selectedEntity.firstName} ${selectedEntity.lastName}`
                    : selectedEntity.name
                  : null}
                entityType={selectedEntity
                  ? 'firstName' in selectedEntity ? 'candidate' : 'company'
                  : null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;