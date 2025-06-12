// api/search.api.ts

import { apiRequest } from './config';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  score: number;
  metadata: Record<string, any>;
}

interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  query: string;
  took_ms: number;
}

interface GlobalSearchFilters {
  query: string;
  entity_types?: string[] | null;
  location?: string | null;
  skills?: string[] | null;
  experience_level?: string | null;
  company_size?: string | null;
  job_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  date_from?: string | null;
  date_to?: string | null;
}

export const searchApi = {
  globalSearch: async (query: string, filters?: Partial<GlobalSearchFilters>): Promise<SearchResponse> => {
    return apiRequest('post', '/search/global', {
      query,
      ...filters,
    });
  },
  
  advancedSearch: async (filters: GlobalSearchFilters): Promise<SearchResponse> => {
    return apiRequest('post', '/search/advanced', filters);
  },
  
  getSearchSuggestions: async (query: string, limit?: number): Promise<string[]> => {
    return apiRequest('get', '/search/suggestions', {
      params: { q: query, limit },
    });
  },
  
  getTrendingSearches: async (): Promise<{
    trending_skills: string[];
    trending_locations: string[];
    trending_job_types: string[];
    popular_searches: string[];
  }> => {
    return apiRequest('get', '/search/trending');
  },
};