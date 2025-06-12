// api/ai-tools.api.ts

import { apiRequest } from './config';
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

export const aiToolsApi = {
  // CV Analysis
  analyzeCV: async (data: CVAnalysisRequest): Promise<CVAnalysisResponse> => {
    return apiRequest('post', '/ai-tools/analyze-cv', data);
  },
  
  // Job Matching
  matchJobs: async (data: JobMatchRequest): Promise<JobMatchResponse> => {
    return apiRequest('post', '/ai-tools/match-jobs', data);
  },
  
  // Email Generation
  generateEmail: async (data: EmailGenerationRequest): Promise<EmailGenerationResponse> => {
    return apiRequest('post', '/ai-tools/generate-email', data);
  },
  
  // Interview Questions
  generateInterviewQuestions: async (data: InterviewQuestionsRequest): Promise<InterviewQuestionsResponse> => {
    return apiRequest('post', '/ai-tools/interview-questions', data);
  },
  
  // Job Description
  generateJobDescription: async (data: JobDescriptionRequest): Promise<JobDescriptionResponse> => {
    return apiRequest('post', '/ai-tools/job-description', data);
  },
  
  // Skills Extraction
  extractSkills: async (text: string): Promise<{ skills: string[]; categories: Record<string, string[]> }> => {
    return apiRequest('post', '/ai-tools/extract-skills', { text });
  },
  
  // Candidate Feedback
  generateCandidateFeedback: async (data: {
    application_id: string;
    feedback_type: string;
    include_suggestions?: boolean;
  }): Promise<{
    feedback: string;
    strengths: string[];
    areas_for_improvement: string[];
    suggestions?: string[];
  }> => {
    return apiRequest('post', '/ai-tools/candidate-feedback', data);
  },
  
  // Resume Optimization
  optimizeResume: async (data: {
    cv_text: string;
    target_job_description?: string;
    optimization_level?: 'basic' | 'advanced';
  }): Promise<{
    optimized_cv: string;
    changes_made: string[];
    improvement_score: number;
  }> => {
    return apiRequest('post', '/ai-tools/optimize-resume', data);
  },
};