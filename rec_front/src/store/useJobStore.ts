// src/store/useJobStore.ts
import { create } from 'zustand';
import { Job } from '@/types';
import { apiService } from '@/lib';

interface JobState {
  // Data
  jobs: Job[];
  selectedJob: Job | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  
  // Actions
  fetchJobs: (officeId?: string) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  fetchJobsByCompany: (companyId: string) => Promise<void>;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<Job>;
  deleteJob: (id: string) => Promise<boolean>;
  setSelectedJob: (job: Job | null) => void;
  resetError: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  // Initial state
  jobs: [],
  selectedJob: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  // Actions
  fetchJobs: async (officeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await apiService.jobs.getAll(officeId);
      set({ jobs, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch jobs'), 
        isLoading: false 
      });
    }
  },
  
  fetchJobById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const job = await apiService.jobs.getById(id);
      set({ selectedJob: job, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch job'), 
        isLoading: false 
      });
    }
  },
  
  fetchJobsByCompany: async (companyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await apiService.jobs.getByCompany(companyId);
      set({ jobs, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch company jobs'), 
        isLoading: false 
      });
    }
  },
  
  createJob: async (job) => {
    set({ isCreating: true, error: null });
    try {
      const newJob = await apiService.jobs.create(job);
      set(state => ({ 
        jobs: [...state.jobs, newJob],
        isCreating: false 
      }));
      return newJob;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to create job'), 
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateJob: async (id, updates) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedJob = await apiService.jobs.update(id, updates);
      set(state => ({ 
        jobs: state.jobs.map(j => 
          j.id === id ? updatedJob : j
        ),
        selectedJob: state.selectedJob?.id === id 
          ? updatedJob 
          : state.selectedJob,
        isUpdating: false 
      }));
      return updatedJob;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to update job'), 
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteJob: async (id) => {
    set({ isDeleting: true, error: null });
    try {
      const success = await apiService.jobs.delete(id);
      if (success) {
        set(state => ({ 
          jobs: state.jobs.filter(j => j.id !== id),
          selectedJob: state.selectedJob?.id === id 
            ? null 
            : state.selectedJob,
          isDeleting: false 
        }));
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to delete job'), 
        isDeleting: false 
      });
      throw error;
    }
  },
  
  setSelectedJob: (job) => {
    set({ selectedJob: job });
  },
  
  resetError: () => {
    set({ error: null });
  }
}));