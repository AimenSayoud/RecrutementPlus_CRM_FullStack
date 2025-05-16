// src/lib/api-client.ts
import { API_BASE_URL } from './api';

interface ApiClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  onAuthError?: () => void;
}

export const createApiClient = (options: ApiClientOptions) => {
  const { baseUrl, getToken, onAuthError } = options;

  const client = {
    request: async (url: string, options: RequestInit = {}) => {
      // Add auth token to all requests
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Build the full URL
      const fullUrl = `${baseUrl}${url}`;
      
      try {
        const response = await fetch(fullUrl, {
          ...options,
          headers,
        });
        
        // Handle 401 unauthorized (expired token)
        if (response.status === 401 && onAuthError) {
          onAuthError();
          throw new Error('Your session has expired. Please log in again.');
        }
        
        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          throw new Error(errorData.detail || 'An error occurred');
        }
        
        // Return JSON data for successful responses
        return await response.json();
      } catch (error) {
        console.error('API Request Error:', error);
        throw error;
      }
    },
    
    get: (url: string, options: Omit<RequestInit, 'method'> = {}) => {
      return client.request(url, { ...options, method: 'GET' });
    },
    
    post: (url: string, data: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
      return client.request(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    put: (url: string, data: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
      return client.request(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    patch: (url: string, data: any, options: Omit<RequestInit, 'method' | 'body'> = {}) => {
      return client.request(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    
    delete: (url: string, options: Omit<RequestInit, 'method'> = {}) => {
      return client.request(url, { ...options, method: 'DELETE' });
    },
  };

  return client;
};

// Default API client instance - will be initialized in api.ts
export type ApiClient = ReturnType<typeof createApiClient>;