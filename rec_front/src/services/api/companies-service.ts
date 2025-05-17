// src/services/api/companies-service.ts
import { Company, Job } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

export const companiesService = {
  getAll: async (officeId?: string, industry?: string, search?: string, hasOpenPositions?: boolean, page = 1, limit = 50) => {
    try {
      let endpoint = '/api/v1/companies?';
      
      if (officeId) endpoint += `office_id=${officeId}&`;
      if (industry) endpoint += `industry=${encodeURIComponent(industry)}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (hasOpenPositions !== undefined) endpoint += `has_open_positions=${hasOpenPositions}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<PaginatedResponse<Company>>(endpoint);
      
      // Ensure all date fields are properly converted to Date objects
      const companies = response.items.map(company => ({
        ...company,
        createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
        updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
      }));
      
      return {
        items: companies,
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        pageCount: response.pageCount
      };
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      throw error;
    }
  },
    
  getById: async (id: string) => {
    try {
      const company = await fetcher<Company>(`/api/v1/companies/${id}`);
      
      return {
        ...company,
        createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
        updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
      };
    } catch (error) {
      console.error('Failed to fetch company:', error);
      throw error;
    }
  },
  
  getJobsByCompany: async (companyId: string) => {
    try {
      const response = await fetcher<{ jobs: Job[], total: number }>(`/api/v1/companies/${companyId}/jobs`);
      
      // Ensure all date fields are properly converted to Date objects
      const jobs = response.jobs.map(job => ({
        ...job,
        createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
        updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
        deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
      }));
      
      return {
        jobs,
        total: response.total
      };
    } catch (error) {
      console.error('Failed to fetch company jobs:', error);
      throw error;
    }
  },
    
  create: async (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCompany = await fetcher<Company>('/api/v1/companies/', {
        method: 'POST',
        body: JSON.stringify(company),
      });
      
      return {
        ...newCompany,
        createdAt: newCompany.createdAt instanceof Date ? newCompany.createdAt : new Date(newCompany.createdAt),
        updatedAt: newCompany.updatedAt instanceof Date ? newCompany.updatedAt : new Date(newCompany.updatedAt),
      };
    } catch (error) {
      console.error('Failed to create company:', error);
      throw error;
    }
  },
    
  update: async (id: string, updates: Partial<Company>) => {
    try {
      const updatedCompany = await fetcher<Company>(`/api/v1/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      return {
        ...updatedCompany,
        createdAt: updatedCompany.createdAt instanceof Date ? updatedCompany.createdAt : new Date(updatedCompany.createdAt),
        updatedAt: updatedCompany.updatedAt instanceof Date ? updatedCompany.updatedAt : new Date(updatedCompany.updatedAt),
      };
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  },
    
  delete: async (id: string) => {
    try {
      const result = await fetcher<{ success: boolean }>(`/api/v1/companies/${id}`, {
        method: 'DELETE',
      });
      
      return result.success;
    } catch (error) {
      console.error('Failed to delete company:', error);
      throw error;
    }
  },
};

export default companiesService;