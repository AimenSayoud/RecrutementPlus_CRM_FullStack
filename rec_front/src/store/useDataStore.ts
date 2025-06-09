import { create } from 'zustand';
import { api } from '@/services/api';
import { 
  CVAnalysisResponse, 
  JobMatchResponseItem, 
  EmailGenerationResponse,
  InterviewQuestionItem,
  JobDescriptionResponse,
  EmailTemplateInfo
} from '@/services/api/types';
import { 
  Candidate, 
  Company,
  Participant
} from '@/types';

interface DisplayParticipant {
  id: string;
  type: string;
  name: string;
  avatar: string | null;
}

interface DataState {
  // Data
  candidates: Candidate[];
  companies: Company[];
  selectedEntity: Candidate | Company | null;
  emailTemplates: EmailTemplateInfo[];
  
  // Data mapped to UI for selection operations
  candidatesAsDisplayParticipants: DisplayParticipant[];
  companiesAsDisplayParticipants: DisplayParticipant[];
  usersAsDisplayParticipants: DisplayParticipant[];
  
  // Loading states
  isLoadingCandidates: boolean;
  isLoadingCompanies: boolean;
  isLoadingEmailTemplates: boolean;
  isLoadingUsers: boolean;
  isProcessingAI: boolean;
  
  // Error states
  candidatesError: string | null;
  companiesError: string | null;
  emailTemplatesError: string | null;
  usersError: string | null;
  aiError: string | null;
  
  // AI response data
  cvAnalysisResult: CVAnalysisResponse | null;
  jobMatches: JobMatchResponseItem[] | null;
  interviewQuestions: InterviewQuestionItem[] | null;
  jobDescription: JobDescriptionResponse | null;
  emailResult: EmailGenerationResponse | null;
  aiResponse: string | null;
  
  // Regular data fetch functions
  fetchCandidates: (officeId?: string) => Promise<void>;
  fetchCompanies: (officeId?: string) => Promise<void>;
  fetchUsers: (officeId?: string, roles?: string[]) => Promise<void>;
  fetchEmailTemplates: () => Promise<void>;
  
  // Entity selection functions
  setSelectedCandidate: (candidate: Candidate) => void;
  setSelectedCompany: (company: Company) => void;
  clearSelectedEntity: () => void;
  
  // AI service functions
  analyzeCv: (cvText: string) => Promise<CVAnalysisResponse>;
  matchJobs: (cvAnalysis: CVAnalysisResponse, jobId?: number) => Promise<JobMatchResponseItem[]>;
  generateEmail: (templateId: string, context: Record<string, any>) => Promise<EmailGenerationResponse>;
  generateInterviewQuestions: (
    jobDetails: { title: string; company_name?: string; description?: string; requirements?: string[]; skills?: string[] },
    candidateInfo?: { name?: string; skills?: string[]; experience_summary?: string; experience_years?: number }
  ) => Promise<InterviewQuestionItem[]>;
  generateJobDescription: (
    position: string,
    companyName: string,
    industry?: string,
    requiredSkills?: string[]
  ) => Promise<JobDescriptionResponse>;
  generateCandidateFeedback: (candidate: Candidate) => Promise<string>;
  processGeneralQuery: (query: string, context?: string) => Promise<string>;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial data
  candidates: [],
  companies: [],
  selectedEntity: null,
  emailTemplates: [],
  candidatesAsDisplayParticipants: [],
  companiesAsDisplayParticipants: [],
  usersAsDisplayParticipants: [],
  
  // Initial loading states
  isLoadingCandidates: false,
  isLoadingCompanies: false,
  isLoadingEmailTemplates: false,
  isLoadingUsers: false,
  isProcessingAI: false,
  
  // Initial error states
  candidatesError: null,
  companiesError: null,
  emailTemplatesError: null,
  usersError: null,
  aiError: null,
  
  // Initial AI response data
  cvAnalysisResult: null,
  jobMatches: null,
  interviewQuestions: null,
  jobDescription: null,
  emailResult: null,
  aiResponse: null,
  
  // Fetch candidates
  fetchCandidates: async (officeId?: string) => {
    // Prevent duplicate requests
    const { isLoadingCandidates } = get();
    if (isLoadingCandidates) return;
    
    set({ isLoadingCandidates: true, candidatesError: null });
    try {
      // Use the API client to fetch candidates from backend
      const response = await api.candidates.getAll(officeId);
      
      // Safely extract candidates from the paginated response
      const candidates = response?.candidates || [];
      
      if (!Array.isArray(candidates)) {
        console.warn('Expected array of candidates but got:', typeof candidates);
        throw new Error('Invalid response format from API');
      }
      
      console.log('Raw candidates response:', response);
      
      // Convert candidates to DisplayParticipants for entity selection
      const candidatesAsDisplayParticipants = candidates.map(candidate => {
        // Add safety checks to avoid null reference errors
        if (!candidate || typeof candidate !== 'object') {
          console.warn('Invalid candidate object:', candidate);
          return null;
        }
        
        return {
          id: candidate.id || 'unknown-id',
          type: 'candidate',
          name: candidate.firstName && candidate.lastName 
            ? `${candidate.firstName} ${candidate.lastName}`
            : 'Unknown Candidate',
          avatar: null
        };
      }).filter(Boolean); // Remove any null values
      
      console.log('Fetched candidates from API:', candidates.length);
      set({ 
        candidates, 
        candidatesAsDisplayParticipants,
        isLoadingCandidates: false 
      });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      
      // Log the error but don't use mock data
      console.warn('Failed to fetch candidates from API');
      
      // Always set empty arrays on error to avoid null reference errors elsewhere
      set({ 
        isLoadingCandidates: false, 
        candidatesError: error instanceof Error ? error.message : 'Failed to fetch candidates',
        candidates: [], 
        candidatesAsDisplayParticipants: []
      });
    }
  },
  
  // Fetch companies
  fetchCompanies: async (officeId?: string) => {
    // Prevent duplicate requests
    const { isLoadingCompanies } = get();
    if (isLoadingCompanies) return;
    
    set({ isLoadingCompanies: true, companiesError: null });
    try {
      // Use the API client to fetch companies from backend
      const response = await api.companies.getAll(officeId);
      
      // Safely extract companies from the paginated response
      const companies = response?.companies || [];
      
      if (!Array.isArray(companies)) {
        console.warn('Expected array of companies but got:', typeof companies);
        throw new Error('Invalid response format from API');
      }
      
      console.log('Raw companies response:', response);
      
      // Convert companies to DisplayParticipants for entity selection
      const companiesAsDisplayParticipants = companies.map(company => {
        // Add safety checks to avoid null reference errors
        if (!company || typeof company !== 'object') {
          console.warn('Invalid company object:', company);
          return null;
        }
        
        return {
          id: company.id || 'unknown-id',
          type: 'employer',
          name: company.name || 'Unknown Company',
          avatar: null
        };
      }).filter(Boolean); // Remove any null values
      
      console.log('Fetched companies from API:', companies.length);
      set({ 
        companies, 
        companiesAsDisplayParticipants,
        isLoadingCompanies: false 
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
      
      // Log the error but don't use mock data
      console.warn('Failed to fetch companies from API');
      
      // Always set empty arrays on error to avoid null reference errors elsewhere
      set({ 
        isLoadingCompanies: false, 
        companiesError: error instanceof Error ? error.message : 'Failed to fetch companies',
        companies: [], 
        companiesAsDisplayParticipants: []
      });
    }
  },
  
  // Fetch users (admins and consultants)
  fetchUsers: async (officeId?: string, roles: string[] = ['admin', 'consultant']) => {
    // Prevent duplicate requests
    const { isLoadingUsers } = get();
    if (isLoadingUsers) return;
    
    set({ isLoadingUsers: true, usersError: null });
    try {
      // Get the combined roles parameter
      const response = await api.users.getAll(officeId, roles.join(','));
      
      // Extract users from the paginated response with safety checks
      const users = response?.users || [];
      
      if (!Array.isArray(users)) {
        console.warn('Expected array of users but got:', typeof users);
        throw new Error('Invalid response format from API');
      }
      
      console.log('Raw users response:', response);
      
      // Convert users to DisplayParticipants for entity selection with safety checks
      const usersAsDisplayParticipants = users.map(user => {
        // Add safety checks to avoid null reference errors
        if (!user || typeof user !== 'object') {
          console.warn('Invalid user object:', user);
          return null;
        }
        
        return {
          id: user.id || 'unknown-id',
          type: user.role === 'super_admin' || user.role === 'admin' ? 'admin' : 'consultant',
          name: user.name || 'Unknown User',
          avatar: null
        };
      }).filter(Boolean); // Remove any null values
      
      console.log('Fetched users from API:', users.length);
      set({ 
        usersAsDisplayParticipants,
        isLoadingUsers: false 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Log the error but don't use mock data
      console.warn('Failed to fetch users from API');
      
      // Always set empty arrays on error to avoid null reference errors elsewhere
      set({ 
        isLoadingUsers: false, 
        usersError: error instanceof Error ? error.message : 'Failed to fetch users',
        usersAsDisplayParticipants: []
      });
    }
  },
  
  // Fetch email templates
  fetchEmailTemplates: async () => {
    set({ isLoadingEmailTemplates: true, emailTemplatesError: null });
    try {
      const templates = await api.getEmailTemplates();
      
      // Add safety check for templates
      if (!Array.isArray(templates)) {
        console.warn('Expected array of email templates but got:', typeof templates);
        throw new Error('Invalid response format from API');
      }
      
      set({ emailTemplates: templates, isLoadingEmailTemplates: false });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      set({ 
        isLoadingEmailTemplates: false, 
        emailTemplatesError: error instanceof Error ? error.message : 'Failed to fetch email templates',
        emailTemplates: [] // Set empty array on error
      });
    }
  },
  
  // Entity selection functions
  setSelectedCandidate: (candidate: Candidate) => {
    set({ selectedEntity: candidate });
  },
  
  setSelectedCompany: (company: Company) => {
    set({ selectedEntity: company });
  },
  
  clearSelectedEntity: () => {
    set({ selectedEntity: null });
  },
  
  // AI service functions
  analyzeCv: async (cvText: string) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const result = await api.analyzeCv(cvText);
      set({ cvAnalysisResult: result, isProcessingAI: false });
      return result;
    } catch (error) {
      console.error('Error analyzing CV:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to analyze CV' 
      });
      throw error;
    }
  },
  
  matchJobs: async (cvAnalysis: CVAnalysisResponse, jobId?: number) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const matches = await api.matchJobs(cvAnalysis, jobId);
      set({ jobMatches: matches, isProcessingAI: false });
      return matches;
    } catch (error) {
      console.error('Error matching jobs:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to match jobs' 
      });
      throw error;
    }
  },
  
  generateEmail: async (templateId: string, context: Record<string, any>) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const result = await api.generateEmail(templateId, context);
      set({ emailResult: result, isProcessingAI: false });
      return result;
    } catch (error) {
      console.error('Error generating email:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to generate email' 
      });
      throw error;
    }
  },
  
  generateInterviewQuestions: async (
    jobDetails: { title: string; company_name?: string; description?: string; requirements?: string[]; skills?: string[] },
    candidateInfo?: { name?: string; skills?: string[]; experience_summary?: string; experience_years?: number }
  ) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const questions = await api.generateInterviewQuestions(jobDetails, candidateInfo);
      set({ interviewQuestions: questions, isProcessingAI: false });
      return questions;
    } catch (error) {
      console.error('Error generating interview questions:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to generate interview questions' 
      });
      throw error;
    }
  },
  
  generateJobDescription: async (
    position: string,
    companyName: string,
    industry?: string,
    requiredSkills?: string[]
  ) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const result = await api.generateJobDescription(position, companyName, industry, requiredSkills);
      set({ jobDescription: result, isProcessingAI: false });
      return result;
    } catch (error) {
      console.error('Error generating job description:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to generate job description' 
      });
      throw error;
    }
  },
  
  generateCandidateFeedback: async (candidate: Candidate) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const feedback = await api.generateCandidateFeedback(candidate);
      set({ aiResponse: feedback, isProcessingAI: false });
      return feedback;
    } catch (error) {
      console.error('Error generating candidate feedback:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to generate candidate feedback' 
      });
      throw error;
    }
  },
  
  processGeneralQuery: async (query: string, context?: string) => {
    set({ isProcessingAI: true, aiError: null });
    try {
      const response = await api.processGeneralQuery(query, context);
      set({ aiResponse: response.content, isProcessingAI: false });
      return response.content;
    } catch (error) {
      console.error('Error processing query:', error);
      set({ 
        isProcessingAI: false, 
        aiError: error instanceof Error ? error.message : 'Failed to process query' 
      });
      throw error;
    }
  }
}));