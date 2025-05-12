// src/lib/index.ts
import { api } from './api';
import { apiFallback } from './api-fallback';
import { apiCombined } from './api-combined';

// Re-export the combined API as the default API
export const apiService = apiCombined;

// Also export the individual APIs in case they are needed
export {
  api as backendAPI,
  apiFallback as mockAPI,
  apiCombined as combinedAPI
};