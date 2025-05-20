// src/services/api/skills-service.ts
import { Skill } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

export const skillsService = {
  getAll: async (category?: string, search?: string, page = 1, limit = 100) => {
    try {
      let endpoint = '/api/v1/skills?';
      
      if (category) endpoint += `category=${encodeURIComponent(category)}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<PaginatedResponse<Skill>>(endpoint);
      
      return {
        items: response.items,
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        pageCount: response.pageCount
      };
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      return await fetcher<Skill>(`/api/v1/skills/${id}`);
    } catch (error) {
      console.error('Failed to fetch skill:', error);
      throw error;
    }
  }
};

export default skillsService;