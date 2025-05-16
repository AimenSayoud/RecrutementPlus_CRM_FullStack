# API Integration Documentation

This document outlines the implementation of the API integration between the RecrutementPlus CRM frontend and backend.

## Architecture

The integration follows a layered architecture:

1. **API Client**: Core HTTP client with authentication handling
2. **API Services**: Entity-specific API methods
3. **Custom Hooks**: React hooks for data fetching and mutations
4. **Components**: UI components consuming the data

## API Client (`src/lib/api-client.ts`)

A centralized client for all API requests that:

- Appends authentication headers to requests
- Handles JSON serialization/deserialization
- Provides typed request/response handling
- Manages authentication errors and token expiration

```typescript
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
    
    // Handle response and errors...
  },
  
  get: (url: string, options = {}) => { /* ... */ },
  post: (url: string, data: any, options = {}) => { /* ... */ },
  put: (url: string, data: any, options = {}) => { /* ... */ },
  delete: (url: string, options = {}) => { /* ... */ },
};
```

## API Service Layer (`src/lib/api.ts`)

Entity-specific API methods that use the API client to make requests:

```typescript
export const api = {
  candidates: {
    getAll: async (officeId?: string) => { /* ... */ },
    getById: async (id: string) => { /* ... */ },
    create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => { /* ... */ },
    update: async (id: string, updates: Partial<Candidate>) => { /* ... */ },
    delete: async (id: string) => { /* ... */ },
  },
  
  // Other entities...
};
```

## Authentication Integration

Authentication is handled through:

1. `AuthContext` for managing user state
2. API client for token management
3. Login form for user authentication

The login flow:

```typescript
const login = async (email: string, password: string) => {
  const result = await apiService.users.login(email, password);
  
  // Store token for API requests
  localStorage.setItem('auth_token', result.token);
  
  // Set the user
  setUser(result.user);
  localStorage.setItem('user', JSON.stringify(result.user));
};
```

## Data Fetching Hooks

Custom hooks for data fetching that provide:

- Loading state
- Error handling
- Refetch capability
- Authentication error handling

```typescript
export function useApiQuery<T>(apiCall: () => Promise<T>, dependencies = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetching logic...
  
  return { data, loading, error, refetch: fetchData };
}
```

## Fallback Mechanism

The API client is configured to:

1. Try the real backend API first
2. Fall back to mock data if the backend is unavailable
3. Allow forcing mock data via URL parameter

## Connected Pages

The following pages have been connected to the backend API:

1. **Candidates Page**: 
   - Lists all candidates with filtering and sorting
   - Supports creating, editing, and deleting candidates
   - Handles search and filtering

2. **Companies Page**: 
   - Lists all companies with filtering
   - Supports full CRUD operations

3. **Dashboard**: 
   - Fetches metrics from the backend
   - Displays recent activity

4. **User Management**:
   - Handles authentication and user data

## Error Handling

Comprehensive error handling is implemented through:

1. API client error interception
2. UI error state management
3. User-friendly error messages
4. Authentication error handling (token expiration)

## Future Improvements

1. Implement data caching for performance
2. Add offline support
3. Implement real-time updates
4. Enhance pagination for large datasets