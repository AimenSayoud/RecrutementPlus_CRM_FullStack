// stores/useSearchStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { searchApi } from '@/api/search.api';

interface SearchResult {
  id: string;
  type: 'candidate' | 'company' | 'job' | 'application';
  title: string;
  description?: string | null;
  score: number;
  metadata: Record<string, any>;
}

interface SearchState {
  results: SearchResult[];
  suggestions: string[];
  trending: {
    skills: string[];
    locations: string[];
    jobTypes: string[];
    searches: string[];
  };
  totalResults: number;
  query: string;
  filters: Record<string, any>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  search: (query: string, filters?: Record<string, any>) => Promise<void>;
  advancedSearch: (filters: Record<string, any>) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  getTrending: () => Promise<void>;
  
  // State management
  setQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearResults: () => void;
  clearError: () => void;
}

export const useSearchStore = create<SearchState>()(
  devtools(
    (set, get) => ({
      results: [],
      suggestions: [],
      trending: {
        skills: [],
        locations: [],
        jobTypes: [],
        searches: [],
      },
      totalResults: 0,
      query: '',
      filters: {},
      isLoading: false,
      error: null,
      
      search: async (query, filters = {}) => {
        set({ isLoading: true, error: null, query });
        try {
          const response = await searchApi.globalSearch(query, filters);
          set({
            results: response.results,
            totalResults: response.total_count,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Search failed', isLoading: false });
        }
      },
      
      advancedSearch: async (filters) => {
        set({ isLoading: true, error: null, filters });
        try {
          const response = await searchApi.advancedSearch(filters);
          set({
            results: response.results,
            totalResults: response.total_count,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Advanced search failed', isLoading: false });
        }
      },
      
      getSuggestions: async (query) => {
        try {
          const suggestions = await searchApi.getSearchSuggestions(query);
          set({ suggestions });
        } catch (error: any) {
          console.error('Failed to get suggestions:', error);
        }
      },
      
      getTrending: async () => {
        try {
          const trending = await searchApi.getTrendingSearches();
          set({ trending });
        } catch (error: any) {
          console.error('Failed to get trending searches:', error);
        }
      },
      
      setQuery: (query) => set({ query }),
      setFilters: (filters) => set({ filters }),
      clearResults: () => set({ results: [], totalResults: 0 }),
      clearError: () => set({ error: null }),
    })
  )
);