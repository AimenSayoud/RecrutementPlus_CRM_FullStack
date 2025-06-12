// stores/useJobStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { jobApi } from '@/api/job.api';
import { Job, JobSearchFilters, JobCreate, JobUpdate } from '@/types/job.types';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  totalJobs: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: JobSearchFilters;
  
  // Actions
  fetchJobs: (filters?: JobSearchFilters) => Promise<void>;
  searchJobs: (query: string, filters?: JobSearchFilters) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (data: JobCreate) => Promise<Job>;
  updateJob: (id: string, data: JobUpdate) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<JobSearchFilters>) => void;
  clearFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialFilters: JobSearchFilters = {
  page: 1,
  page_size: 20,
  sort_by: 'created_at',
  order: 'desc',
};

export const useJobStore = create<JobState>()(
  devtools(
    (set, get) => ({
      jobs: [],
      currentJob: null,
      totalJobs: 0,
      currentPage: 1,
      pageSize: 20,
      isLoading: false,
      error: null,
      filters: initialFilters,
      
      fetchJobs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await jobApi.listJobs(filters || get().filters);
          set({
            jobs: response.items,
            totalJobs: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch jobs', isLoading: false });
        }
      },
      
      searchJobs: async (query, filters) => {
        set({ isLoading: true, error: null });
        try {
          const searchFilters = { ...get().filters, ...filters, query };
          const response = await jobApi.searchJobs(searchFilters);
          set({
            jobs: response.items,
            totalJobs: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            filters: searchFilters,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to search jobs', isLoading: false });
        }
      },
      
      fetchJobById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const job = await jobApi.getJobWithDetails(id);
          set({ currentJob: job, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch job', isLoading: false });
        }
      },
      
      createJob: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const job = await jobApi.createJob(data);
          set((state) => ({
            jobs: [job, ...state.jobs],
            isLoading: false,
          }));
          return job;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to create job', isLoading: false });
          throw error;
        }
      },
      
      updateJob: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const job = await jobApi.updateJob(id, data);
          set((state) => ({
            jobs: state.jobs.map((j) => (j.id === id ? job : j)),
            currentJob: state.currentJob?.id === id ? job : state.currentJob,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update job', isLoading: false });
          throw error;
        }
      },
      
      deleteJob: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await jobApi.deleteJob(id);
          set((state) => ({
            jobs: state.jobs.filter((j) => j.id !== id),
            currentJob: state.currentJob?.id === id ? null : state.currentJob,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete job', isLoading: false });
          throw error;
        }
      },
      
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },
      
      clearFilters: () => {
        set({ filters: initialFilters });
      },
      
      setPage: (page) => {
        set((state) => ({
          currentPage: page,
          filters: { ...state.filters, page },
        }));
      },
      
      setPageSize: (pageSize) => {
        set((state) => ({
          pageSize,
          filters: { ...state.filters, page_size: pageSize },
        }));
      },
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        jobs: [],
        currentJob: null,
        totalJobs: 0,
        currentPage: 1,
        pageSize: 20,
        isLoading: false,
        error: null,
        filters: initialFilters,
      }),
    })
  )
);