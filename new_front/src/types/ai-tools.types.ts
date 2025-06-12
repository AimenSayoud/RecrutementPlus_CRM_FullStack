// types/ai-tools.types.ts

export interface CVAnalysisRequest {
  cv_text: string;
  candidate_id?: string | null;
}

export interface CVAnalysisResponse {
  skills: string[];
  skill_ids: string[];
  education: Record<string, any>[];
  experience: Record<string, any>[];
  total_experience_years: number;
  summary: string;
  analysis_method: string;
  confidence_score?: number | null;
  processing_time?: number | null;
}

export interface JobMatchRequest {
  candidate_id?: string | null;
  cv_analysis?: CVAnalysisResponse | null;
  job_ids?: string[] | null;
  max_jobs_to_match?: number;
  min_match_score?: number;
}

export interface JobMatchResult {
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  gaps: string[];
}

export interface JobMatchResponse {
  matches: JobMatchResult[];
  total_jobs_analyzed: number;
  processing_time?: number;
}

export interface EmailGenerationRequest {
  template_type: string;
  context: Record<string, any>;
  tone?: string;
  length?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  body: string;
  template_used?: string;
  personalization_score?: number;
}

export interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  expected_answer_points?: string[];
  follow_up_questions?: string[];
}

export interface InterviewQuestionsRequest {
  job_id?: string;
  job_description?: string;
  skills?: string[];
  experience_level?: string;
  question_count?: number;
  include_behavioral?: boolean;
  include_technical?: boolean;
}

export interface InterviewQuestionsResponse {
  questions: InterviewQuestion[];
  job_context?: string;
  interview_tips?: string[];
}

export interface JobDescriptionRequest {
  position: string;
  company_name: string;
  industry?: string;
  required_skills?: string[];
}

export interface JobDescriptionResponse {
  title: string;
  company_overview: string;
  role_summary: string;
  key_responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications?: string[];
  required_skills: string[];
  benefits?: string[];
  location_environment?: string;
  application_process?: string;
  full_text: string;
  generation_method?: string;
}

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