// stores/useSkillStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { skillApi } from '@/api/skill.api';
import {
  Skill,
  SkillCategory,
  SkillCreate,
  SkillUpdate,
  SkillSearchFilters,
} from '@/types/skill.types';

interface SkillState {
  skills: Skill[];
  categories: SkillCategory[];
  trendingSkills: Skill[];
  currentSkill: Skill | null;
  totalSkills: number;
  isLoading: boolean;
  error: string | null;
  filters: SkillSearchFilters;
  
  // Actions
  fetchSkills: (filters?: SkillSearchFilters) => Promise<void>;
  fetchSkillById: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTrendingSkills: (timePeriod?: string, limit?: number) => Promise<void>;
  getSkillSuggestions: (query: string) => Promise<Skill[]>;
  createSkill: (data: SkillCreate) => Promise<Skill>;
  updateSkill: (id: string, data: SkillUpdate) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  
  // Categories
  createCategory: (data: { name: string; description?: string }) => Promise<SkillCategory>;
  updateCategory: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<SkillSearchFilters>) => void;
  clearFilters: () => void;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialFilters: SkillSearchFilters = {
  page: 1,
  page_size: 50,
  sort_by: 'name',
  order: 'asc',
};

export const useSkillStore = create<SkillState>()(
  devtools(
    (set, get) => ({
      skills: [],
      categories: [],
      trendingSkills: [],
      currentSkill: null,
      totalSkills: 0,
      isLoading: false,
      error: null,
      filters: initialFilters,
      
      fetchSkills: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await skillApi.listSkills(filters || get().filters);
          set({
            skills: response.items,
            totalSkills: response.total,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch skills', isLoading: false });
        }
      },
      
      fetchSkillById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const skill = await skillApi.getSkillById(id);
          set({ currentSkill: skill, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch skill', isLoading: false });
        }
      },
      
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const categories = await skillApi.listSkillCategories();
          set({ categories, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch categories', isLoading: false });
        }
      },
      
      fetchTrendingSkills: async (timePeriod, limit) => {
        set({ isLoading: true, error: null });
        try {
          const skills = await skillApi.getTrendingSkills(timePeriod, limit);
          set({ trendingSkills: skills, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch trending skills', isLoading: false });
        }
      },
      
      getSkillSuggestions: async (query) => {
        try {
          return await skillApi.getSkillSuggestions(query);
        } catch (error: any) {
          console.error('Failed to get skill suggestions:', error);
          return [];
        }
      },
      
      createSkill: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const skill = await skillApi.createSkill(data);
          set((state) => ({
            skills: [skill, ...state.skills],
            isLoading: false,
          }));
          return skill;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to create skill', isLoading: false });
          throw error;
        }
      },
      
      updateSkill: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const skill = await skillApi.updateSkill(id, data);
          set((state) => ({
            skills: state.skills.map((s) => (s.id === id ? skill : s)),
            currentSkill: state.currentSkill?.id === id ? skill : state.currentSkill,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update skill', isLoading: false });
          throw error;
        }
      },
      
      deleteSkill: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await skillApi.deleteSkill(id);
          set((state) => ({
            skills: state.skills.filter((s) => s.id !== id),
            currentSkill: state.currentSkill?.id === id ? null : state.currentSkill,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete skill', isLoading: false });
          throw error;
        }
      },
      
      createCategory: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const category = await skillApi.createSkillCategory(data);
          set((state) => ({
            categories: [...state.categories, category],
            isLoading: false,
          }));
          return category;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to create category', isLoading: false });
          throw error;
        }
      },
      
      updateCategory: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const category = await skillApi.updateSkillCategory(id, data);
          set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? category : c)),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update category', isLoading: false });
          throw error;
        }
      },
      
      deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await skillApi.deleteSkillCategory(id);
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete category', isLoading: false });
          throw error;
        }
      },
      
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },
      
      clearFilters: () => {
        set({ filters: initialFilters });
      },
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        skills: [],
        categories: [],
        trendingSkills: [],
        currentSkill: null,
        totalSkills: 0,
        isLoading: false,
        error: null,
        filters: initialFilters,
      }),
    })
  )
);