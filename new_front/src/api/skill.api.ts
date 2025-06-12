// api/skill.api.ts

import { apiRequest } from './config';
import {
  Skill,
  SkillCategory,
  SkillCreate,
  SkillUpdate,
  SkillSearchFilters,
  SkillListResponse,
} from '@/types/skill.types';

export const skillApi = {
  // Skills
  listSkills: async (filters?: SkillSearchFilters): Promise<SkillListResponse> => {
    return apiRequest('get', '/skills', { params: filters });
  },
  
  getSkillById: async (id: string): Promise<Skill> => {
    return apiRequest('get', `/skills/${id}`);
  },
  
  createSkill: async (data: SkillCreate): Promise<Skill> => {
    return apiRequest('post', '/skills', data);
  },
  
  updateSkill: async (id: string, data: SkillUpdate): Promise<Skill> => {
    return apiRequest('put', `/skills/${id}`, data);
  },
  
  deleteSkill: async (id: string): Promise<void> => {
    await apiRequest('delete', `/skills/${id}`);
  },
  
  // Categories
  listSkillCategories: async (): Promise<SkillCategory[]> => {
    return apiRequest('get', '/skills/categories');
  },
  
  createSkillCategory: async (data: { name: string; description?: string }): Promise<SkillCategory> => {
    return apiRequest('post', '/skills/categories', data);
  },
  
  updateSkillCategory: async (id: string, data: { name?: string; description?: string }): Promise<SkillCategory> => {
    return apiRequest('put', `/skills/categories/${id}`, data);
  },
  
  deleteSkillCategory: async (id: string): Promise<void> => {
    await apiRequest('delete', `/skills/categories/${id}`);
  },
  
  // Trending and suggestions
  getTrendingSkills: async (timePeriod?: string, limit?: number): Promise<Skill[]> => {
    return apiRequest('get', '/skills/trending', { 
      params: { time_period: timePeriod, limit } 
    });
  },
  
  getSkillSuggestions: async (query: string): Promise<Skill[]> => {
    return apiRequest('get', '/skills/suggestions', { 
      params: { q: query } 
    });
  },
  
  // Statistics
  getSkillStats: async (skillId: string): Promise<any> => {
    return apiRequest('get', `/skills/${skillId}/stats`);
  },
};