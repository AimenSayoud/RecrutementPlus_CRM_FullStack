// src/lib/api-combined.ts
import { api } from './api';
import { apiFallback } from './api-fallback';
import { Candidate, Company, Job, User, Office } from '@/types';

// Flag to control which API to use - configurable via environment variables
// Always try to use the backend API first, but fall back to mock data if needed
const USE_BACKEND = true; // Set to true to use the backend first (for login)
const FALLBACK_ON_ERROR = true; // Set to true to allow fallback to mock data on errors

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
      
    login: (email: string, password: string) => 
      handleAPICall(
        () => api.users.login(email, password),
        () => apiFallback.users.login(email, password)
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

  // Team
  team: {
    getAll: (officeId?: string, filters?: { type?: string; status?: string }) => 
      handleAPICall(
        () => api.team.getAll(officeId, filters),
        () => apiFallback.team?.getAll(officeId, filters) || [] // Fallback to empty array if not defined
      ),
      
    getById: (id: string) => 
      handleAPICall(
        () => api.team.getById(id),
        () => apiFallback.team?.getById(id) || null
      ),
      
    getByUserId: (userId: string) => 
      handleAPICall(
        () => api.team.getByUserId(userId),
        () => apiFallback.team?.getByUserId(userId) || null
      ),
      
    create: (member: any) => 
      handleAPICall(
        () => api.team.create(member),
        () => apiFallback.team?.create(member) || member
      ),
      
    update: (id: string, updates: any) => 
      handleAPICall(
        () => api.team.update(id, updates),
        () => apiFallback.team?.update(id, updates) || { ...updates, id }
      ),
      
    delete: (id: string) => 
      handleAPICall(
        () => api.team.delete(id),
        () => apiFallback.team?.delete(id) || true
      ),
  },

  // Dashboard data
  dashboard: {
    getMetrics: (officeId?: string) => 
      handleAPICall(
        () => api.dashboard.getMetrics(officeId),
        // Fallback mock dashboard metrics
        () => ({
          openPositions: 24,
          placements: 76,
          avgTimeToHire: 32,
          activeRecruitments: 18,
          pipelineData: {
            applied: 45,
            screening: 28,
            interview: 16,
            offer: 8,
            hired: 4
          },
          monthlyData: [
            { month: 'Jan', newCandidates: 30, hired: 10 },
            { month: 'Feb', newCandidates: 35, hired: 12 },
            { month: 'Mar', newCandidates: 45, hired: 15 },
            { month: 'Apr', newCandidates: 40, hired: 13 },
            { month: 'May', newCandidates: 50, hired: 18 },
            { month: 'Jun', newCandidates: 55, hired: 20 }
          ]
        })
      ),
    
    getRecentActivity: (officeId?: string) => 
      handleAPICall(
        () => api.dashboard.getRecentActivity(officeId),
        // Fallback mock recent activity
        () => ([
          {
            id: 'act-1',
            type: 'Interview',
            name: 'Emma Thompson',
            position: 'Senior Developer',
            company: 'TechCorp',
            time: '10:00 AM',
            date: new Date(Date.now() + 3600000) // 1 hour from now
          },
          {
            id: 'act-2',
            type: 'Follow-up',
            name: 'Michael Rodriguez',
            position: 'Product Manager',
            company: 'Innovate Inc.',
            time: '2:30 PM',
            date: new Date(Date.now() + 3600000 * 5) // 5 hours from now
          },
          {
            id: 'act-3',
            type: 'Screening',
            name: 'Sarah Chen',
            position: 'UX Designer',
            company: 'DesignHub',
            time: '9:15 AM',
            date: new Date(Date.now() + 86400000) // Tomorrow
          }
        ])
      ),
  },
};