// stores/useAIToolsStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { aiToolsApi } from '@/api/ai-tools.api';
import {
  CVAnalysisRequest,
  CVAnalysisResponse,
  JobMatchRequest,
  JobMatchResponse,
  EmailGenerationRequest,
  EmailGenerationResponse,
  InterviewQuestionsRequest,
  InterviewQuestionsResponse,
  JobDescriptionRequest,
  JobDescriptionResponse,
} from '@/types/ai-tools.types';

interface AIToolsState {
  // CV Analysis
  cvAnalysis: CVAnalysisResponse | null;
  isAnalyzingCV: boolean;
  cvAnalysisError: string | null;
  
  // Job Matching
  jobMatches: JobMatchResponse | null;
  isMatchingJobs: boolean;
  jobMatchError: string | null;
  
  // Email Generation
  generatedEmail: EmailGenerationResponse | null;
  isGeneratingEmail: boolean;
  emailError: string | null;
  
  // Interview Questions
  interviewQuestions: InterviewQuestionsResponse | null;
  isGeneratingQuestions: boolean;
  questionsError: string | null;
  
  // Job Description
  jobDescription: JobDescriptionResponse | null;
  isGeneratingJobDesc: boolean;
  jobDescError: string | null;
  
  // Actions
  analyzeCV: (data: CVAnalysisRequest) => Promise<CVAnalysisResponse>;
  matchJobs: (data: JobMatchRequest) => Promise<JobMatchResponse>;
  generateEmail: (data: EmailGenerationRequest) => Promise<EmailGenerationResponse>;
  generateInterviewQuestions: (data: InterviewQuestionsRequest) => Promise<InterviewQuestionsResponse>;
  generateJobDescription: (data: JobDescriptionRequest) => Promise<JobDescriptionResponse>;
  extractSkills: (text: string) => Promise<{ skills: string[]; categories: Record<string, string[]> }>;
  
  // Clear functions
  clearCVAnalysis: () => void;
  clearJobMatches: () => void;
  clearGeneratedEmail: () => void;
  clearErrors: () => void;
  reset: () => void;
}

export const useAIToolsStore = create<AIToolsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      cvAnalysis: null,
      isAnalyzingCV: false,
      cvAnalysisError: null,
      
      jobMatches: null,
      isMatchingJobs: false,
      jobMatchError: null,
      
      generatedEmail: null,
      isGeneratingEmail: false,
      emailError: null,
      
      interviewQuestions: null,
      isGeneratingQuestions: false,
      questionsError: null,
      
      jobDescription: null,
      isGeneratingJobDesc: false,
      jobDescError: null,
      
      // CV Analysis
      analyzeCV: async (data) => {
        set({ isAnalyzingCV: true, cvAnalysisError: null });
        try {
          const response = await aiToolsApi.analyzeCV(data);
          set({ cvAnalysis: response, isAnalyzingCV: false });
          return response;
        } catch (error: any) {
          set({ 
            cvAnalysisError: error.detail || 'Failed to analyze CV', 
            isAnalyzingCV: false 
          });
          throw error;
        }
      },
      
      // Job Matching
      matchJobs: async (data) => {
        set({ isMatchingJobs: true, jobMatchError: null });
        try {
          const response = await aiToolsApi.matchJobs(data);
          set({ jobMatches: response, isMatchingJobs: false });
          return response;
        } catch (error: any) {
          set({ 
            jobMatchError: error.detail || 'Failed to match jobs', 
            isMatchingJobs: false 
          });
          throw error;
        }
      },
      
      // Email Generation
      generateEmail: async (data) => {
        set({ isGeneratingEmail: true, emailError: null });
        try {
          const response = await aiToolsApi.generateEmail(data);
          set({ generatedEmail: response, isGeneratingEmail: false });
          return response;
        } catch (error: any) {
          set({ 
            emailError: error.detail || 'Failed to generate email', 
            isGeneratingEmail: false 
          });
          throw error;
        }
      },
      
      // Interview Questions
      generateInterviewQuestions: async (data) => {
        set({ isGeneratingQuestions: true, questionsError: null });
        try {
          const response = await aiToolsApi.generateInterviewQuestions(data);
          set({ interviewQuestions: response, isGeneratingQuestions: false });
          return response;
        } catch (error: any) {
          set({ 
            questionsError: error.detail || 'Failed to generate questions', 
            isGeneratingQuestions: false 
          });
          throw error;
        }
      },
      
      // Job Description
      generateJobDescription: async (data) => {
        set({ isGeneratingJobDesc: true, jobDescError: null });
        try {
          const response = await aiToolsApi.generateJobDescription(data);
          set({ jobDescription: response, isGeneratingJobDesc: false });
          return response;
        } catch (error: any) {
          set({ 
            jobDescError: error.detail || 'Failed to generate job description', 
            isGeneratingJobDesc: false 
          });
          throw error;
        }
      },
      
      // Skills Extraction
      extractSkills: async (text) => {
        try {
          const response = await aiToolsApi.extractSkills(text);
          return response;
        } catch (error: any) {
          throw error;
        }
      },
      
      // Clear functions
      clearCVAnalysis: () => set({ cvAnalysis: null, cvAnalysisError: null }),
      clearJobMatches: () => set({ jobMatches: null, jobMatchError: null }),
      clearGeneratedEmail: () => set({ generatedEmail: null, emailError: null }),
      clearErrors: () => set({ 
        cvAnalysisError: null, 
        jobMatchError: null, 
        emailError: null,
        questionsError: null,
        jobDescError: null
      }),
      
      reset: () => set({
        cvAnalysis: null,
        isAnalyzingCV: false,
        cvAnalysisError: null,
        jobMatches: null,
        isMatchingJobs: false,
        jobMatchError: null,
        generatedEmail: null,
        isGeneratingEmail: false,
        emailError: null,
        interviewQuestions: null,
        isGeneratingQuestions: false,
        questionsError: null,
        jobDescription: null,
        isGeneratingJobDesc: false,
        jobDescError: null,
      }),
    })
  )
);