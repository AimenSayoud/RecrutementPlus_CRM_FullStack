// api/job.api.ts

import { apiRequest } from './config';
import {
  Job,
  JobCreate,
  JobUpdate,
  JobSearchFilters,
  JobListResponse,
  JobSkillRequirement,
} from '@/types/job.types';

export const jobApi = {
  // Search and list
  searchJobs: async (filters: JobSearchFilters): Promise<JobListResponse> => {
    return apiRequest('get', '/jobs/search', { params: filters });
  },
  
  listJobs: async (filters?: JobSearchFilters): Promise<JobListResponse> => {
    return apiRequest('get', '/jobs', { params: filters });
  },
  
  // Get single job
  getJobById: async (id: string): Promise<Job> => {
    return apiRequest('get', `/jobs/${id}`);
  },
  
  getJobWithDetails: async (id: string): Promise<Job> => {
    return apiRequest('get', `/jobs/${id}/details`);
  },
  
  // Create and update (employer/admin)
  createJob: async (data: JobCreate): Promise<Job> => {
    return apiRequest('post', '/jobs', data);
  },
  
  updateJob: async (id: string, data: JobUpdate): Promise<Job> => {
    return apiRequest('put', `/jobs/${id}`, data);
  },
  
  deleteJob: async (id: string): Promise<void> => {
    await apiRequest('delete', `/jobs/${id}`);
  },
  
  // Job status
  publishJob: async (id: string): Promise<Job> => {
    return apiRequest('post', `/jobs/${id}/publish`);
  },
  
  closeJob: async (id: string): Promise<Job> => {
    return apiRequest('post', `/jobs/${id}/close`);
  },
  
  // Skills requirements
  getJobSkills: async (jobId: string): Promise<JobSkillRequirement[]> => {
    return apiRequest('get', `/jobs/${jobId}/skills`);
  },
  
  updateJobSkills: async (jobId: string, skills: any[]): Promise<JobSkillRequirement[]> => {
    return apiRequest('put', `/jobs/${jobId}/skills`, skills);
  },
  
  // Applications
  getJobApplications: async (jobId: string): Promise<any> => {
    return apiRequest('get', `/jobs/${jobId}/applications`);
  },
  
  getJobApplicationStats: async (jobId: string): Promise<any> => {
    return apiRequest('get', `/jobs/${jobId}/application-stats`);
  },
  
  // Recommendations
  getSimilarJobs: async (jobId: string, limit?: number): Promise<Job[]> => {
    return apiRequest('get', `/jobs/${jobId}/similar`, { params: { limit } });
  },
  
  // Employer specific
  getMyJobs: async (filters?: JobSearchFilters): Promise<JobListResponse> => {
    return apiRequest('get', '/jobs/my-jobs', { params: filters });
  },
};