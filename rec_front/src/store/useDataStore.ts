import { create } from 'zustand';
import api, { 
  CVAnalysisResponse, 
  JobMatchResponseItem, 
  EmailGenerationResponse,
  InterviewQuestionItem,
  JobDescriptionResponse,
  EmailTemplateInfo
} from '@/lib/api-client';
import { Candidate, Company } from '@/types';

interface DataState {
  // Data
  candidates: Candidate[];
  companies: Company[];
  selectedEntity: Candidate | Company | null;
  emailTemplates: EmailTemplateInfo[];
  
  // Loading states
  isLoadingCandidates: boolean;
  isLoadingCompanies: boolean;
  isLoadingEmailTemplates: boolean;
  isProcessingAI: boolean;
  
  // Error states
  candidatesError: string | null;
  companiesError: string | null;
  emailTemplatesError: string | null;
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
  
  // Initial loading states
  isLoadingCandidates: false,
  isLoadingCompanies: false,
  isLoadingEmailTemplates: false,
  isProcessingAI: false,
  
  // Initial error states
  candidatesError: null,
  companiesError: null,
  emailTemplatesError: null,
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
    set({ isLoadingCandidates: true, candidatesError: null });
    try {
      // Mock implementation - in a real app, you'd call your API
      // const response = await apiClient.get(`/candidates?officeId=${officeId || ''}`);
      // Simulating API fetch until you connect your actual endpoint
      const mockCandidates: Candidate[] = [
        {
          id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', position: 'Developer',
          phone: '',
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          officeId: ''
        },
        {
          id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', position: 'Designer',
          phone: '',
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          officeId: ''
        },
        // Add more mock data as needed
      ];
      
      // In production, replace with:
      // const candidates = response.data;
      const candidates = mockCandidates;
      
      set({ candidates, isLoadingCandidates: false });
    } catch (error) {
      console.error('Error fetching candidates:', error);
      set({ 
        isLoadingCandidates: false, 
        candidatesError: error instanceof Error ? error.message : 'Failed to fetch candidates' 
      });
    }
  },
  
  // Fetch companies
  fetchCompanies: async (officeId?: string) => {
    set({ isLoadingCompanies: true, companiesError: null });
    try {
      // Mock implementation - in a real app, you'd call your API
      // const response = await apiClient.get(`/companies?officeId=${officeId || ''}`);
      // Simulating API fetch until you connect your actual endpoint
      const mockCompanies: Company[] = [
        {
          id: '1', name: 'Acme Inc', industry: 'Technology', contactPerson: 'Tom Johnson',
          contactEmail: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          openPositions: 0,
          officeId: ''
        },
        {
          id: '2', name: 'Globex Corp', industry: 'Finance', contactPerson: 'Sarah Williams',
          contactEmail: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          openPositions: 0,
          officeId: ''
        },
        // Add more mock data as needed
      ];
      
      // In production, replace with:
      // const companies = response.data;
      const companies = mockCompanies;
      
      set({ companies, isLoadingCompanies: false });
    } catch (error) {
      console.error('Error fetching companies:', error);
      set({ 
        isLoadingCompanies: false, 
        companiesError: error instanceof Error ? error.message : 'Failed to fetch companies' 
      });
    }
  },
  
  // Fetch email templates
  fetchEmailTemplates: async () => {
    set({ isLoadingEmailTemplates: true, emailTemplatesError: null });
    try {
      const templates = await api.getEmailTemplates();
      set({ emailTemplates: templates, isLoadingEmailTemplates: false });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      set({ 
        isLoadingEmailTemplates: false, 
        emailTemplatesError: error instanceof Error ? error.message : 'Failed to fetch email templates' 
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