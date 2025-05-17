// src/services/api/candidates-service.ts
import { Candidate } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

export const candidatesService = {
  getAll: async (officeId?: string, search?: string, skill?: string, status?: string, page = 1, limit = 50) => {
    try {
      let endpoint = '/api/v1/candidates?';
      
      if (officeId) endpoint += `office_id=${officeId}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (skill) endpoint += `skill=${encodeURIComponent(skill)}&`;
      if (status) endpoint += `status=${status}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<PaginatedResponse<Candidate>>(endpoint);
      
      // Ensure all date fields are properly converted to Date objects
      const candidates = response.items.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
        updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
      }));
      
      return {
        items: candidates,
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        pageCount: response.pageCount
      };
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      throw error;
    }
  },
    
  getById: async (id: string) => {
    try {
      const candidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`);
      
      return {
        ...candidate,
        createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
        updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
      };
    } catch (error) {
      console.error('Failed to fetch candidate:', error);
      throw error;
    }
  },
    
  create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCandidate = await fetcher<Candidate>('/api/v1/candidates/', {
        method: 'POST',
        body: JSON.stringify(candidate),
      });
      
      return {
        ...newCandidate,
        createdAt: newCandidate.createdAt instanceof Date ? newCandidate.createdAt : new Date(newCandidate.createdAt),
        updatedAt: newCandidate.updatedAt instanceof Date ? newCandidate.updatedAt : new Date(newCandidate.updatedAt),
      };
    } catch (error) {
      console.error('Failed to create candidate:', error);
      throw error;
    }
  },
    
  update: async (id: string, updates: Partial<Candidate>) => {
    try {
      const updatedCandidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      return {
        ...updatedCandidate,
        createdAt: updatedCandidate.createdAt instanceof Date ? updatedCandidate.createdAt : new Date(updatedCandidate.createdAt),
        updatedAt: updatedCandidate.updatedAt instanceof Date ? updatedCandidate.updatedAt : new Date(updatedCandidate.updatedAt),
      };
    } catch (error) {
      console.error('Failed to update candidate:', error);
      throw error;
    }
  },
    
  delete: async (id: string) => {
    try {
      const result = await fetcher<{ success: boolean }>(`/api/v1/candidates/${id}`, {
        method: 'DELETE',
      });
      
      return result.success;
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      throw error;
    }
  },
};

export default candidatesService;