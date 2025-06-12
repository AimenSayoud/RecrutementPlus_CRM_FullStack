// stores/useApplicationStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { applicationApi } from '@/api/application.api';
import {
  Application,
  ApplicationCreate,
  ApplicationSearchFilters,
  ApplicationStatusChange,
} from '@/types/application.types';

interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  totalApplications: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: ApplicationSearchFilters;
  
  // Actions
  fetchApplications: (filters?: ApplicationSearchFilters) => Promise<void>;
  fetchMyApplications: (filters?: ApplicationSearchFilters) => Promise<void>;
  fetchApplicationById: (id: string) => Promise<void>;
  applyToJob: (data: ApplicationCreate) => Promise<Application>;
  updateApplicationStatus: (id: string, data: ApplicationStatusChange) => Promise<void>;
  withdrawApplication: (id: string) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<ApplicationSearchFilters>) => void;
  clearFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialFilters: ApplicationSearchFilters = {
  page: 1,
  page_size: 20,
  sort_by: 'applied_at',
  order: 'desc',
};

export const useApplicationStore = create<ApplicationState>()(
  devtools(
    (set, get) => ({
      applications: [],
      currentApplication: null,
      totalApplications: 0,
      currentPage: 1,
      pageSize: 20,
      isLoading: false,
      error: null,
      filters: initialFilters,
      
      fetchApplications: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await applicationApi.listApplications(filters || get().filters);
          set({
            applications: response.items,
            totalApplications: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch applications', isLoading: false });
        }
      },
      
      fetchMyApplications: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await applicationApi.getMyApplications(filters || get().filters);
          set({
            applications: response.items,
            totalApplications: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch applications', isLoading: false });
        }
      },
      
      fetchApplicationById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const application = await applicationApi.getApplicationById(id);
          set({ currentApplication: application, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch application', isLoading: false });
        }
      },
      
      applyToJob: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const application = await applicationApi.applyToJob(data);
          set((state) => ({
            applications: [application, ...state.applications],
            isLoading: false,
          }));
          return application;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to apply to job', isLoading: false });
          throw error;
        }
      },
      
      updateApplicationStatus: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await applicationApi.changeApplicationStatus(id, data);
          set((state) => ({
            applications: state.applications.map((app) => (app.id === id ? updated : app)),
            currentApplication: state.currentApplication?.id === id ? updated : state.currentApplication,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update application status', isLoading: false });
          throw error;
        }
      },
      
      withdrawApplication: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await applicationApi.withdrawApplication(id);
          set((state) => ({
            applications: state.applications.map((app) =>
              app.id === id ? { ...app, status: 'withdrawn' as any } : app
            ),
            currentApplication:
              state.currentApplication?.id === id
                ? { ...state.currentApplication, status: 'withdrawn' as any }
                : state.currentApplication,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to withdraw application', isLoading: false });
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
        applications: [],
        currentApplication: null,
        totalApplications: 0,
        currentPage: 1,
        pageSize: 20,
        isLoading: false,
        error: null,
        filters: initialFilters,
      }),
    })
  )
);

// utils/date.utils.ts

export const formatDate = (date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    return getRelativeTime(dateObj);
  }
  
  const options: Intl.DateTimeFormatOptions = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
    
  return dateObj.toLocaleDateString('en-US', options);
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(date, 'short');
};

// utils/format.utils.ts

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (
  num: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatEnumValue = (value: string): string => {
  return value
    .split('_')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

// utils/validation.utils.ts

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};