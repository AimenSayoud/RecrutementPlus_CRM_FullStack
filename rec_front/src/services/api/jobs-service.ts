// src/services/api/jobs-service.ts
import { Job } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

export const jobsService = {
  getAll: async (officeId?: string, companyId?: string, status?: string, skill?: string, search?: string, page = 1, limit = 50) => {
    try {
      let endpoint = '/api/v1/jobs?';
      
      if (officeId) endpoint += `office_id=${officeId}&`;
      if (companyId) endpoint += `company_id=${companyId}&`;
      if (status) endpoint += `status=${status}&`;
      if (skill) endpoint += `skill=${encodeURIComponent(skill)}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<PaginatedResponse<Job>>(endpoint);
      
      // Ensure all date fields are properly converted to Date objects
      const jobs = response.items.map(job => ({
        ...job,
        createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
        updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
        deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
      }));
      
      return {
        items: jobs,
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        pageCount: response.pageCount
      };
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  },
    
  getById: async (id: string) => {
    try {
      const job = await fetcher<Job>(`/api/v1/jobs/${id}`);
      
      return {
        ...job,
        createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
        updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
        deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
      };
    } catch (error) {
      console.error('Failed to fetch job:', error);
      throw error;
    }
  },
    
  getByCompany: async (companyId: string) => {
    try {
      const jobs = await fetcher<Job[]>(`/api/v1/companies/${companyId}/jobs`);
      
      return jobs.map(job => ({
        ...job,
        createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
        updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
        deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        postedAt: job.postedAt ? (job.postedAt instanceof Date ? job.postedAt : new Date(job.postedAt)) : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch company jobs:', error);
      throw error;
    }
  },
    
  create: async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newJob = await fetcher<Job>('/api/v1/jobs/', {
        method: 'POST',
        body: JSON.stringify(job),
      });
      
      return {
        ...newJob,
        createdAt: newJob.createdAt instanceof Date ? newJob.createdAt : new Date(newJob.createdAt),
        updatedAt: newJob.updatedAt instanceof Date ? newJob.updatedAt : new Date(newJob.updatedAt),
        deadline: newJob.deadline ? (newJob.deadline instanceof Date ? newJob.deadline : new Date(newJob.deadline)) : undefined,
        postedAt: newJob.postedAt ? (newJob.postedAt instanceof Date ? newJob.postedAt : new Date(newJob.postedAt)) : undefined,
      };
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  },
    
  update: async (id: string, updates: Partial<Job>) => {
    try {
      const updatedJob = await fetcher<Job>(`/api/v1/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      return {
        ...updatedJob,
        createdAt: updatedJob.createdAt instanceof Date ? updatedJob.createdAt : new Date(updatedJob.createdAt),
        updatedAt: updatedJob.updatedAt instanceof Date ? updatedJob.updatedAt : new Date(updatedJob.updatedAt),
        deadline: updatedJob.deadline ? (updatedJob.deadline instanceof Date ? updatedJob.deadline : new Date(updatedJob.deadline)) : undefined,
        postedAt: updatedJob.postedAt ? (updatedJob.postedAt instanceof Date ? updatedJob.postedAt : new Date(updatedJob.postedAt)) : undefined,
      };
    } catch (error) {
      console.error('Failed to update job:', error);
      throw error;
    }
  },
    
  delete: async (id: string) => {
    try {
      const result = await fetcher<{ success: boolean }>(`/api/v1/jobs/${id}`, {
        method: 'DELETE',
      });
      
      return result.success;
    } catch (error) {
      console.error('Failed to delete job:', error);
      throw error;
    }
  },
};

export default jobsService;