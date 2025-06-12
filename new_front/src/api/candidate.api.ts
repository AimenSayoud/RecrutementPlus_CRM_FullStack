// api/candidate.api.ts

import { apiRequest } from './config';
import {
  CandidateProfile,
  CandidateProfileCreate,
  CandidateProfileUpdate,
  CandidateEducation,
  EducationCreate,
  CandidateExperience,
  WorkExperienceCreate,
  CandidateSkill,
  CandidateSkillUpdate,
  CandidateJobPreference,
  CandidateNotificationSettings,
  CandidateSearchFilters,
  CandidateListResponse,
} from '@/types/candidate.types';

export const candidateApi = {
  // Profile
  getMyProfile: async (): Promise<CandidateProfile> => {
    return apiRequest('get', '/candidates/me');
  },
  
  createMyProfile: async (data: CandidateProfileCreate): Promise<CandidateProfile> => {
    return apiRequest('post', '/candidates/me', data);
  },
  
  updateMyProfile: async (data: CandidateProfileUpdate): Promise<CandidateProfile> => {
    return apiRequest('put', '/candidates/me', data);
  },
  
  // Education
  getMyEducation: async (): Promise<CandidateEducation[]> => {
    return apiRequest('get', '/candidates/me/education');
  },
  
  addEducation: async (data: EducationCreate): Promise<CandidateEducation> => {
    return apiRequest('post', '/candidates/me/education', data);
  },
  
  updateEducation: async (id: string, data: Partial<EducationCreate>): Promise<CandidateEducation> => {
    return apiRequest('put', `/candidates/me/education/${id}`, data);
  },
  
  deleteEducation: async (id: string): Promise<void> => {
    await apiRequest('delete', `/candidates/me/education/${id}`);
  },
  
  // Experience
  getMyExperience: async (): Promise<CandidateExperience[]> => {
    return apiRequest('get', '/candidates/me/experience');
  },
  
  addExperience: async (data: WorkExperienceCreate): Promise<CandidateExperience> => {
    return apiRequest('post', '/candidates/me/experience', data);
  },
  
  updateExperience: async (id: string, data: Partial<WorkExperienceCreate>): Promise<CandidateExperience> => {
    return apiRequest('put', `/candidates/me/experience/${id}`, data);
  },
  
  deleteExperience: async (id: string): Promise<void> => {
    await apiRequest('delete', `/candidates/me/experience/${id}`);
  },
  
  // Skills
  getMySkills: async (): Promise<CandidateSkill[]> => {
    return apiRequest('get', '/candidates/me/skills');
  },
  
  updateMySkills: async (skills: CandidateSkillUpdate[]): Promise<CandidateSkill[]> => {
    return apiRequest('put', '/candidates/me/skills', skills);
  },
  
  // Preferences
  getMyPreferences: async (): Promise<CandidateJobPreference> => {
    return apiRequest('get', '/candidates/me/preferences');
  },
  
  updateMyPreferences: async (data: Partial<CandidateJobPreference>): Promise<CandidateJobPreference> => {
    return apiRequest('put', '/candidates/me/preferences', data);
  },
  
  // Notifications
  getMyNotificationSettings: async (): Promise<CandidateNotificationSettings> => {
    return apiRequest('get', '/candidates/me/notification-settings');
  },
  
  updateMyNotificationSettings: async (data: Partial<CandidateNotificationSettings>): Promise<CandidateNotificationSettings> => {
    return apiRequest('put', '/candidates/me/notification-settings', data);
  },
  
  // Job Matching
  getMatchingJobs: async (limit?: number): Promise<any> => {
    return apiRequest('get', '/candidates/me/matching-jobs', { limit });
  },
  
  // Skills Recommendations
  getSkillRecommendations: async (limit?: number): Promise<any> => {
    return apiRequest('get', '/candidates/me/skill-recommendations', { limit });
  },
  
  // Career Progression
  getCareerProgression: async (): Promise<any> => {
    return apiRequest('get', '/candidates/me/career-progression');
  },
  
  // Application Analytics
  getApplicationAnalytics: async (): Promise<any> => {
    return apiRequest('get', '/candidates/me/application-analytics');
  },
  
  // Admin/Consultant endpoints
  searchCandidates: async (filters: CandidateSearchFilters): Promise<CandidateListResponse> => {
    return apiRequest('get', '/candidates', { params: filters });
  },
  
  getCandidateById: async (id: string): Promise<CandidateProfile> => {
    return apiRequest('get', `/candidates/${id}`);
  },
};

