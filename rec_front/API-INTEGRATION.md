# API Integration with Zustand

This document explains how the API integration is implemented in the RecPlus CRM using Zustand for state management.

## Architecture Overview

The API integration follows a layered architecture:

1. **API Client Layer**
   - Provides a generic interface for HTTP requests
   - Handles authentication, error handling, and request formatting
   - Located at `/src/lib/api-client.ts`

2. **API Service Layer**
   - Defines specific endpoints for entities (candidates, companies, jobs, etc.)
   - Includes strong typing for requests and responses
   - Located at `/src/lib/api.ts`

3. **API Combination Layer**
   - Combines backend API with fallback mock data
   - Provides seamless fallback when backend is not available
   - Located at `/src/lib/api-combined.ts`

4. **Zustand State Stores**
   - Implements global state management with API integration
   - Each entity has its own store for CRUD operations
   - Located in the `/src/store/` directory

## Zustand Stores

The following Zustand stores have been implemented:

### Authentication Store (`useAuthStore.ts`)
- Manages user authentication state
- Handles login/logout operations
- Stores JWT token and user information
- Provides user role-based permission checks

### Candidate Store (`useCandidateStore.ts`)
- Manages candidate data and operations
- Implements CRUD operations for candidates
- Handles loading states and error handling

### Company Store (`useCompanyStore.ts`)
- Manages company data and operations
- Implements CRUD operations for companies
- Tracks relationships with jobs and contacts

### Job Store (`useJobStore.ts`)
- Manages job listings and operations
- Implements CRUD operations for jobs
- Provides filtering and searching capabilities

### Dashboard Store (`useDashboardStore.ts`)
- Manages dashboard metrics and data
- Fetches recruitment pipeline statistics 
- Retrieves recent activities and events

## API Client Implementation

The API client in `src/lib/api-client.ts` provides a reusable pattern for API calls:

```typescript
export const createApiClient = (options: ApiClientOptions) => {
  const { baseUrl, getToken, onAuthError } = options;
  
  const client = {
    request: async (url: string, options: RequestInit = {}) => {
      // Add auth token to all requests
      const token = getToken();
      const headers = { 'Content-Type': 'application/json', ...options.headers };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Handle request implementation...
    },
    get: (url: string, options = {}) => { /* ... */ },
    post: (url: string, data: any, options = {}) => { /* ... */ },
    put: (url: string, data: any, options = {}) => { /* ... */ },
    delete: (url: string, options = {}) => { /* ... */ },
  };
  
  return client;
};
```

## Usage in Components

### Dashboard Page

The dashboard page uses multiple Zustand stores to fetch and display data:

```typescript
// In the dashboard component
const { 
  metrics, 
  recentActivity, 
  isLoadingMetrics, 
  isLoadingActivity, 
  fetchMetrics,
  fetchRecentActivity
} = useDashboardStore();

const { user } = useAuthStore();

// Load data when the component mounts
useEffect(() => {
  const officeId = user?.role === 'super_admin' ? undefined : user?.officeId;
  fetchMetrics(officeId);
  fetchRecentActivity(officeId);
  
  // Also prefetch candidates and jobs for the dashboard
  useCandidateStore.getState().fetchCandidates(officeId);
  useJobStore.getState().fetchJobs(officeId);
}, [user?.officeId, user?.role, fetchMetrics, fetchRecentActivity]);
```

### Candidates Page

The candidates page uses the candidate store for data operations:

```typescript
// In the candidates component
const { 
  candidates, 
  selectedCandidate, 
  setSelectedCandidate,
  isLoading: loading, 
  error, 
  fetchCandidates,
  updateCandidate,
  createCandidate
} = useCandidateStore();

// Fetch candidates on mount
useEffect(() => {
  fetchCandidates(user?.role === 'super_admin' ? undefined : user?.officeId);
}, [user?.officeId, user?.role, fetchCandidates]);
```

## Fallback Mechanism

The API integration includes a fallback mechanism for development and testing:

1. **Environment Variable Control**:
   - `NEXT_PUBLIC_USE_MOCK_DATA=true` to always use mock data
   - `NEXT_PUBLIC_USE_MOCK_DATA=false` to try backend first, then fall back to mock data if unavailable

2. **URL Parameter Control**:
   - Adding `?useMockData=true` to any URL forces the use of mock data for that session

3. **Mock Implementation**:
   - Mock data is defined in `/src/lib/api-fallback.ts`
   - Simulates network delays for a realistic experience
   - Provides a complete set of CRUD operations for all entities

## Error Handling

Error handling is implemented at multiple levels:

1. **API Client Level**:
   - Handles HTTP error responses
   - Triggers authentication errors when token is invalid
   - Provides error details for debugging

2. **Zustand Store Level**:
   - Each store tracks error state for its operations
   - Provides error messages to components
   - Allows for retry mechanisms and recovery

3. **Component Level**:
   - Components display appropriate loading and error states
   - Provides user-friendly error messages
   - Implements retry functionality for failed operations

## Adding New API Endpoints

To add a new API endpoint:

1. Add the endpoint to `/src/lib/api.ts`:
   ```typescript
   // Example adding a new endpoint
   export const api = {
     // ... existing endpoints
     
     newEntity: {
       getAll: async () => {
         try {
           const entities = await getApiClient().get<Entity[]>('/api/v1/new-entity');
           return entities;
         } catch (error) {
           console.error('Failed to fetch entities:', error);
           throw error;
         }
       },
       // Add other CRUD operations...
     },
   }
   ```

2. Add fallback implementation in `/src/lib/api-fallback.ts`:
   ```typescript
   export const apiFallback = {
     // ... existing fallbacks
     
     newEntity: {
       getAll: () => 
         apiRequest(async () => {
           return mockEntities;
         }, 'Failed to fetch entities'),
       // Add other CRUD operations...
     },
   }
   ```

3. Update the combined API in `/src/lib/api-combined.ts`:
   ```typescript
   export const apiCombined = {
     // ... existing combinations
     
     newEntity: {
       getAll: () => 
         handleAPICall(
           () => api.newEntity.getAll(),
           () => apiFallback.newEntity.getAll()
         ),
       // Add other CRUD operations...
     },
   }
   ```

4. Create a new Zustand store:
   ```typescript
   // src/store/useNewEntityStore.ts
   import { create } from 'zustand';
   import { apiService } from '@/lib';
   
   interface NewEntityState {
     entities: Entity[];
     isLoading: boolean;
     error: Error | null;
     fetchEntities: () => Promise<void>;
     // Add other state and actions...
   }
   
   export const useNewEntityStore = create<NewEntityState>((set) => ({
     entities: [],
     isLoading: false,
     error: null,
     
     fetchEntities: async () => {
       set({ isLoading: true, error: null });
       try {
         const entities = await apiService.newEntity.getAll();
         set({ entities, isLoading: false });
       } catch (error) {
         set({ 
           error: error instanceof Error ? error : new Error('Failed to fetch entities'), 
           isLoading: false 
         });
       }
     },
     // Implement other actions...
   }));
   ```