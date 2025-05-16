// src/lib/api.ts
import { Candidate, Company, Job, User, Office } from '@/types';
import { apiFallback } from './api-fallback';
import { createApiClient, ApiClient } from './api-client';

// API base URL from environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Helper function to determine if we should use mock data
export const shouldUseMockData = () => {
  return USE_MOCK_DATA || typeof window === 'undefined';
}

// Initialize API client
let apiClient: ApiClient;

// Initialize client with authentication handling
export const initApiClient = () => {
  if (apiClient) return apiClient;
  
  apiClient = createApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('auth_token');
    },
    onAuthError: () => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    },
  });
  
  return apiClient;
};

// Helper function to format date objects
const formatDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

// Get the API client (initializes if needed)
const getApiClient = (): ApiClient => {
  if (!apiClient) {
    return initApiClient();
  }
  return apiClient;
};

// API Service
export const api = {
  // Candidates
  candidates: {
    getAll: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/candidates?office_id=${officeId}`
          : '/api/v1/candidates';
        
        const candidates = await getApiClient().get<Candidate[]>(endpoint);
        
        // Ensure all date fields are properly converted to Date objects
        return candidates.map(candidate => ({
          ...candidate,
          createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
          updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
        }));
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
        throw error;
      }
    },
      
    getById: async (id: string) => {
      try {
        const candidate = await getApiClient().get<Candidate>(`/api/v1/candidates/${id}`);
        
        return {
          ...candidate,
          createdAt: candidate.createdAt instanceof Date ? candidate.createdAt : new Date(candidate.createdAt),
          updatedAt: candidate.updatedAt instanceof Date ? candidate.updatedAt : new Date(candidate.updatedAt),
        };
      } catch (error) {
        console.error('Failed to fetch candidate:', error);
        throw error;
      }
    },
      
    create: async (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newCandidate = await getApiClient().post<Candidate>('/api/v1/candidates/', candidate);
        
        return {
          ...newCandidate,
          createdAt: newCandidate.createdAt instanceof Date ? newCandidate.createdAt : new Date(newCandidate.createdAt),
          updatedAt: newCandidate.updatedAt instanceof Date ? newCandidate.updatedAt : new Date(newCandidate.updatedAt),
        };
      } catch (error) {
        console.error('Failed to create candidate:', error);
        throw error;
      }
    },
      
    update: async (id: string, updates: Partial<Candidate>) => {
      try {
        const updatedCandidate = await getApiClient().put<Candidate>(`/api/v1/candidates/${id}`, updates);
        
        return {
          ...updatedCandidate,
          createdAt: updatedCandidate.createdAt instanceof Date ? updatedCandidate.createdAt : new Date(updatedCandidate.createdAt),
          updatedAt: updatedCandidate.updatedAt instanceof Date ? updatedCandidate.updatedAt : new Date(updatedCandidate.updatedAt),
        };
      } catch (error) {
        console.error('Failed to update candidate:', error);
        throw error;
      }
    },
      
    delete: async (id: string) => {
      try {
        const result = await getApiClient().delete<{ success: boolean }>(`/api/v1/candidates/${id}`);
        
        return result.success;
      } catch (error) {
        console.error('Failed to delete candidate:', error);
        throw error;
      }
    },
  },
  
  // Companies
  companies: {
    getAll: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/companies?office_id=${officeId}`
          : '/api/v1/companies';
        
        const companies = await getApiClient().get<Company[]>(endpoint);
        
        return companies.map(company => ({
          ...company,
          createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
          updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
        }));
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        throw error;
      }
    },
      
    getById: async (id: string) => {
      try {
        const company = await getApiClient().get<Company>(`/api/v1/companies/${id}`);
        
        return {
          ...company,
          createdAt: company.createdAt instanceof Date ? company.createdAt : new Date(company.createdAt),
          updatedAt: company.updatedAt instanceof Date ? company.updatedAt : new Date(company.updatedAt),
        };
      } catch (error) {
        console.error('Failed to fetch company:', error);
        throw error;
      }
    },
      
    create: async (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newCompany = await getApiClient().post<Company>('/api/v1/companies/', company);
        
        return {
          ...newCompany,
          createdAt: newCompany.createdAt instanceof Date ? newCompany.createdAt : new Date(newCompany.createdAt),
          updatedAt: newCompany.updatedAt instanceof Date ? newCompany.updatedAt : new Date(newCompany.updatedAt),
        };
      } catch (error) {
        console.error('Failed to create company:', error);
        throw error;
      }
    },
      
    update: async (id: string, updates: Partial<Company>) => {
      try {
        const updatedCompany = await getApiClient().put<Company>(`/api/v1/companies/${id}`, updates);
        
        return {
          ...updatedCompany,
          createdAt: updatedCompany.createdAt instanceof Date ? updatedCompany.createdAt : new Date(updatedCompany.createdAt),
          updatedAt: updatedCompany.updatedAt instanceof Date ? updatedCompany.updatedAt : new Date(updatedCompany.updatedAt),
        };
      } catch (error) {
        console.error('Failed to update company:', error);
        throw error;
      }
    },
      
    delete: async (id: string) => {
      try {
        const result = await getApiClient().delete<{ success: boolean }>(`/api/v1/companies/${id}`);
        
        return result.success;
      } catch (error) {
        console.error('Failed to delete company:', error);
        throw error;
      }
    },
  },
  
  // Jobs
  jobs: {
    getAll: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/jobs?office_id=${officeId}`
          : '/api/v1/jobs';
        
        const jobs = await getApiClient().get<Job[]>(endpoint);
        
        return jobs.map(job => ({
          ...job,
          createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
          updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
          deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        }));
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        throw error;
      }
    },
      
    getById: async (id: string) => {
      try {
        const job = await getApiClient().get<Job>(`/api/v1/jobs/${id}`);
        
        return {
          ...job,
          createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
          updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
          deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        };
      } catch (error) {
        console.error('Failed to fetch job:', error);
        throw error;
      }
    },
      
    getByCompany: async (companyId: string) => {
      try {
        const jobs = await getApiClient().get<Job[]>(`/api/v1/jobs/company/${companyId}`);
        
        return jobs.map(job => ({
          ...job,
          createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
          updatedAt: job.updatedAt instanceof Date ? job.updatedAt : new Date(job.updatedAt),
          deadline: job.deadline ? (job.deadline instanceof Date ? job.deadline : new Date(job.deadline)) : undefined,
        }));
      } catch (error) {
        console.error('Failed to fetch company jobs:', error);
        throw error;
      }
    },
      
    create: async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newJob = await getApiClient().post<Job>('/api/v1/jobs/', job);
        
        return {
          ...newJob,
          createdAt: newJob.createdAt instanceof Date ? newJob.createdAt : new Date(newJob.createdAt),
          updatedAt: newJob.updatedAt instanceof Date ? newJob.updatedAt : new Date(newJob.updatedAt),
          deadline: newJob.deadline ? (newJob.deadline instanceof Date ? newJob.deadline : new Date(newJob.deadline)) : undefined,
        };
      } catch (error) {
        console.error('Failed to create job:', error);
        throw error;
      }
    },
      
    update: async (id: string, updates: Partial<Job>) => {
      try {
        const updatedJob = await getApiClient().put<Job>(`/api/v1/jobs/${id}`, updates);
        
        return {
          ...updatedJob,
          createdAt: updatedJob.createdAt instanceof Date ? updatedJob.createdAt : new Date(updatedJob.createdAt),
          updatedAt: updatedJob.updatedAt instanceof Date ? updatedJob.updatedAt : new Date(updatedJob.updatedAt),
          deadline: updatedJob.deadline ? (updatedJob.deadline instanceof Date ? updatedJob.deadline : new Date(updatedJob.deadline)) : undefined,
        };
      } catch (error) {
        console.error('Failed to update job:', error);
        throw error;
      }
    },
      
    delete: async (id: string) => {
      try {
        const result = await getApiClient().delete<{ success: boolean }>(`/api/v1/jobs/${id}`);
        
        return result.success;
      } catch (error) {
        console.error('Failed to delete job:', error);
        throw error;
      }
    },
  },
  
  // Users
  users: {
    getAll: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/users?office_id=${officeId}`
          : '/api/v1/users';
        
        const users = await getApiClient().get<User[]>(endpoint);
        
        return users.map(user => ({
          ...user,
          createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
          updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
          lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
        }));
      } catch (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }
    },
      
    getById: async (id: string) => {
      try {
        const user = await getApiClient().get<User>(`/api/v1/users/${id}`);
        
        return {
          ...user,
          createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
          updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
          lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
        };
      } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error;
      }
    },
    
    login: async (email: string, password: string) => {
      try {
        // The backend login endpoint is at /api/v1/users/login
        const result = await getApiClient().post<{ user: User; token: string }>(
          '/api/v1/users/login', 
          { email, password }
        );
        return result;
      } catch (error) {
        console.error('Failed to login:', error);
        throw error;
      }
    },
  },
  
  // Skills
  skills: {
    getAll: async () => {
      try {
        return await getApiClient().get<{ id: number, name: string }[]>('/api/v1/skills');
      } catch (error) {
        console.error('Failed to fetch skills:', error);
        throw error;
      }
    },
  },
  
  // Offices
  offices: {
    getAll: async () => {
      try {
        const offices = await getApiClient().get<Office[]>('/api/v1/offices');
        
        return offices.map(office => ({
          ...office,
          createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
          updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
        }));
      } catch (error) {
        console.error('Failed to fetch offices:', error);
        throw error;
      }
    },
      
    getById: async (id: string) => {
      try {
        const office = await getApiClient().get<Office>(`/api/v1/offices/${id}`);
        
        return {
          ...office,
          createdAt: office.createdAt instanceof Date ? office.createdAt : new Date(office.createdAt),
          updatedAt: office.updatedAt instanceof Date ? office.updatedAt : new Date(office.updatedAt),
        };
      } catch (error) {
        console.error('Failed to fetch office:', error);
        throw error;
      }
    },
  },
  
  // Team
  team: {
    getAll: async (officeId?: string, filters?: { type?: string; status?: string }) => {
      try {
        let endpoint = '/api/v1/team';
        const params = new URLSearchParams();
        
        if (officeId) params.append('office_id', officeId);
        if (filters?.type) params.append('type', filters.type);
        if (filters?.status) params.append('status', filters.status);
        
        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
        
        const teamMembers = await getApiClient().get<any[]>(endpoint);
        
        return teamMembers.map(member => ({
          ...member,
          createdAt: member.createdAt instanceof Date ? member.createdAt : new Date(member.createdAt),
          updatedAt: member.updatedAt instanceof Date ? member.updatedAt : new Date(member.updatedAt),
          lastActivity: member.lastActivity ? (member.lastActivity instanceof Date ? member.lastActivity : new Date(member.lastActivity)) : undefined,
          joinedDate: member.joinedDate ? (member.joinedDate instanceof Date ? member.joinedDate : new Date(member.joinedDate)) : undefined,
        }));
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        throw error;
      }
    },
    
    getById: async (id: string) => {
      try {
        const member = await getApiClient().get<any>(`/api/v1/team/${id}`);
        
        return {
          ...member,
          createdAt: member.createdAt instanceof Date ? member.createdAt : new Date(member.createdAt),
          updatedAt: member.updatedAt instanceof Date ? member.updatedAt : new Date(member.updatedAt),
          lastActivity: member.lastActivity ? (member.lastActivity instanceof Date ? member.lastActivity : new Date(member.lastActivity)) : undefined,
          joinedDate: member.joinedDate ? (member.joinedDate instanceof Date ? member.joinedDate : new Date(member.joinedDate)) : undefined,
        };
      } catch (error) {
        console.error('Failed to fetch team member:', error);
        throw error;
      }
    },
    
    getByUserId: async (userId: string) => {
      try {
        const member = await getApiClient().get<any>(`/api/v1/team/user/${userId}`);
        
        return {
          ...member,
          createdAt: member.createdAt instanceof Date ? member.createdAt : new Date(member.createdAt),
          updatedAt: member.updatedAt instanceof Date ? member.updatedAt : new Date(member.updatedAt),
          lastActivity: member.lastActivity ? (member.lastActivity instanceof Date ? member.lastActivity : new Date(member.lastActivity)) : undefined,
          joinedDate: member.joinedDate ? (member.joinedDate instanceof Date ? member.joinedDate : new Date(member.joinedDate)) : undefined,
        };
      } catch (error) {
        console.error('Failed to fetch team member by user ID:', error);
        throw error;
      }
    },
    
    create: async (member: any) => {
      try {
        const newMember = await getApiClient().post<any>('/api/v1/team/', member);
        
        return {
          ...newMember,
          createdAt: newMember.createdAt instanceof Date ? newMember.createdAt : new Date(newMember.createdAt),
          updatedAt: newMember.updatedAt instanceof Date ? newMember.updatedAt : new Date(newMember.updatedAt),
        };
      } catch (error) {
        console.error('Failed to create team member:', error);
        throw error;
      }
    },
    
    update: async (id: string, updates: any) => {
      try {
        const updatedMember = await getApiClient().put<any>(`/api/v1/team/${id}`, updates);
        
        return {
          ...updatedMember,
          createdAt: updatedMember.createdAt instanceof Date ? updatedMember.createdAt : new Date(updatedMember.createdAt),
          updatedAt: updatedMember.updatedAt instanceof Date ? updatedMember.updatedAt : new Date(updatedMember.updatedAt),
        };
      } catch (error) {
        console.error('Failed to update team member:', error);
        throw error;
      }
    },
    
    delete: async (id: string) => {
      try {
        const result = await getApiClient().delete<{ success: boolean }>(`/api/v1/team/${id}`);
        
        return result.success;
      } catch (error) {
        console.error('Failed to delete team member:', error);
        throw error;
      }
    },
  },
  
  // Dashboard data
  dashboard: {
    getMetrics: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/dashboard/metrics?office_id=${officeId}`
          : '/api/v1/dashboard/metrics';
        return await getApiClient().get(endpoint);
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
        throw error;
      }
    },
    
    getRecentActivity: async (officeId?: string) => {
      try {
        const endpoint = officeId 
          ? `/api/v1/dashboard/activity?office_id=${officeId}`
          : '/api/v1/dashboard/activity';
        return await getApiClient().get(endpoint);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        throw error;
      }
    },
  },
};

// Initialize API client on module load
initApiClient();