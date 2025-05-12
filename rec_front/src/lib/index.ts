// src/lib/index.ts
import { api } from './api';
import { apiFallback } from './api-fallback';
import { apiCombined, forceFallbackData } from './api-combined';

// Check for environment variables and choose appropriate API
const FORCE_MOCK_DATA = typeof window !== 'undefined' && window.location.search.includes('useMockData=true');

// Re-export the combined API as the default API, or use fallback if forced via URL param
export const apiService = FORCE_MOCK_DATA ? forceFallbackData() : apiCombined;

// Also export the individual APIs in case they are needed
export {
  api as backendAPI,
  apiFallback as mockAPI,
  apiCombined as combinedAPI,
  forceFallbackData
};