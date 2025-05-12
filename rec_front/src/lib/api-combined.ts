// src/lib/api-combined.ts
import { api } from './api';
import { apiFallback } from './api-fallback';
import { Candidate, Company, Job, User, Office } from '@/types';

// Flag to control which API to use - configurable via environment variables
// Always try to use the backend API first, but fall back to mock data if needed
const USE_BACKEND = true;
const FALLBACK_ON_ERROR = true; // Set to false to prevent fallback to mock data

// Ensure fallback data is always used when requested, regardless of errors
export const forceFallbackData = () => {
  console.log('Forcing use of fallback data instead of backend API');
  return apiFallback;
};

const handleAPICall = async <T>(backendCall: () => Promise<T>, fallbackCall: () => Promise<T>): Promise<T> => {
  // Use fallback if not using backend
  if (!USE_BACKEND) {
    return fallbackCall();
  }

  // Try backend first, fall back if needed
  try {
    return await backendCall();
  } catch (error) {
    console.warn('Backend API call failed, using fallback data:', error);
    
    if (FALLBACK_ON_ERROR) {
      return fallbackCall();
    }
    
    throw error;
  }
};

// Combined API that tries backend first, then falls back to mock data
export const apiCombined = {
  // Candidates
  candidates: {
    getAll: (officeId?: string) => 
      handleAPICall(
        () => api.candidates.getAll(officeId),
        () => apiFallback.candidates.getAll(officeId)
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.candidates.getById(id),
        () => apiFallback.candidates.getById(id)
      ),
      
    create: (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => 
      handleAPICall(
        () => api.candidates.create(candidate),
        () => apiFallback.candidates.create(candidate)
      ),
      
    update: (id: string, updates: Partial<Candidate>) => 
      handleAPICall(
        () => api.candidates.update(id, updates),
        () => apiFallback.candidates.update(id, updates)
      ),
      
    delete: (id: string) => 
      handleAPICall(
        () => api.candidates.delete(id),
        () => apiFallback.candidates.delete(id)
      ),
  },
  
  // Companies
  companies: {
    getAll: (officeId?: string) => 
      handleAPICall(
        () => api.companies.getAll(officeId),
        () => apiFallback.companies.getAll(officeId)
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.companies.getById(id),
        () => apiFallback.companies.getById(id)
      ),
      
    create: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => 
      handleAPICall(
        () => api.companies.create(company),
        () => apiFallback.companies.create(company)
      ),
      
    update: (id: string, updates: Partial<Company>) => 
      handleAPICall(
        () => api.companies.update(id, updates),
        () => apiFallback.companies.update(id, updates)
      ),
      
    delete: (id: string) => 
      handleAPICall(
        () => api.companies.delete(id),
        () => apiFallback.companies.delete(id)
      ),
  },
  
  // Jobs
  jobs: {
    getAll: (officeId?: string) => 
      handleAPICall(
        () => api.jobs.getAll(officeId),
        () => apiFallback.jobs.getAll(officeId)
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.jobs.getById(id),
        () => apiFallback.jobs.getById(id)
      ),
      
    getByCompany: (companyId: string) => 
      handleAPICall(
        () => api.jobs.getByCompany(companyId),
        () => apiFallback.jobs.getByCompany(companyId)
      ),
      
    create: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => 
      handleAPICall(
        () => api.jobs.create(job),
        () => apiFallback.jobs.create(job)
      ),
      
    update: (id: string, updates: Partial<Job>) => 
      handleAPICall(
        () => api.jobs.update(id, updates),
        () => apiFallback.jobs.update(id, updates)
      ),
      
    delete: (id: string) => 
      handleAPICall(
        () => api.jobs.delete(id),
        () => apiFallback.jobs.delete(id)
      ),
  },
  
  // Users
  users: {
    getAll: (officeId?: string) => 
      handleAPICall(
        () => api.users.getAll(officeId),
        () => apiFallback.users.getAll(officeId)
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.users.getById(id),
        () => apiFallback.users.getById(id)
      ),
  },

  // Skills
  skills: {
    getAll: () => 
      handleAPICall(
        () => api.skills.getAll(),
        () => apiFallback.skills.getAll()
      ),
  },
  
  // Offices
  offices: {
    getAll: () => 
      handleAPICall(
        () => api.offices.getAll(),
        () => apiFallback.offices.getAll()
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.offices.getById(id),
        () => apiFallback.offices.getById(id)
      ),
  },
};