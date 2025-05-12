// src/lib/api.ts
import { Candidate, Company, Job, User, Office } from '@/types';
import { apiFallback } from './api-fallback';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// Helper function to determine if we should use mock data
const shouldUseMockData = () => {
  return USE_MOCK_DATA || typeof window === 'undefined';
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'An error occurred');
  }
  return response.json();
};

// Helper function to format date objects
const formatDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

// Generic fetcher function
const fetcher = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
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
        
        const candidates = await fetcher<Candidate[]>(endpoint);
        
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
        const candidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`);
        
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
        const newCandidate = await fetcher<Candidate>('/api/v1/candidates/', {
          method: 'POST',
          body: JSON.stringify(candidate),
        });
        
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
        const updatedCandidate = await fetcher<Candidate>(`/api/v1/candidates/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
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
        const result = await fetcher<{ success: boolean }>(`/api/v1/candidates/${id}`, {
          method: 'DELETE',
        });
        
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
        
        const companies = await fetcher<Company[]>(endpoint);
        
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
        const company = await fetcher<Company>(`/api/v1/companies/${id}`);
        
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
        const newCompany = await fetcher<Company>('/api/v1/companies/', {
          method: 'POST',
          body: JSON.stringify(company),
        });
        
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
        const updatedCompany = await fetcher<Company>(`/api/v1/companies/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
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
        const result = await fetcher<{ success: boolean }>(`/api/v1/companies/${id}`, {
          method: 'DELETE',
        });
        
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
        
        const jobs = await fetcher<Job[]>(endpoint);
        
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
        const job = await fetcher<Job>(`/api/v1/jobs/${id}`);
        
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
        const jobs = await fetcher<Job[]>(`/api/v1/jobs/company/${companyId}`);
        
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
        const newJob = await fetcher<Job>('/api/v1/jobs/', {
          method: 'POST',
          body: JSON.stringify(job),
        });
        
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
        const updatedJob = await fetcher<Job>(`/api/v1/jobs/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        
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
        const result = await fetcher<{ success: boolean }>(`/api/v1/jobs/${id}`, {
          method: 'DELETE',
        });
        
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
        
        const users = await fetcher<User[]>(endpoint);
        
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
        const user = await fetcher<User>(`/api/v1/users/${id}`);
        
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
  },
  
  // Skills
  skills: {
    getAll: async () => {
      try {
        return await fetcher<{ id: number, name: string }[]>('/api/v1/skills');
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
        const offices = await fetcher<Office[]>('/api/v1/offices');

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
        const office = await fetcher<Office>(`/api/v1/offices/${id}`);

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

  // SuperAdmin
  superAdmin: {
    getAvailableOffices: async () => {
      try {
        const response = await fetcher<{offices: string[]}>('/api/v1/superadmins/offices');
        return response.offices;
      } catch (error) {
        console.error('Failed to fetch available offices:', error);
        throw error;
      }
    },

    updateOffice: async (userId: string, office: string) => {
      try {
        const response = await fetcher(`/api/v1/superadmins/update-office/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ office }),
        });
        return response;
      } catch (error) {
        console.error('Failed to update office:', error);
        throw error;
      }
    }
  },
};