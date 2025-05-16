// src/store/useCompanyStore.ts
import { create } from 'zustand';
import { Company } from '@/types';
import { apiService } from '@/lib';

interface CompanyState {
  // Data
  companies: Company[];
  selectedCompany: Company | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  
  // Actions
  fetchCompanies: (officeId?: string) => Promise<void>;
  fetchCompanyById: (id: string) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<boolean>;
  setSelectedCompany: (company: Company | null) => void;
  resetError: () => void;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  // Initial state
  companies: [],
  selectedCompany: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  // Actions
  fetchCompanies: async (officeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const companies = await apiService.companies.getAll(officeId);
      set({ companies, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch companies'), 
        isLoading: false 
      });
    }
  },
  
  fetchCompanyById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const company = await apiService.companies.getById(id);
      set({ selectedCompany: company, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch company'), 
        isLoading: false 
      });
    }
  },
  
  createCompany: async (company) => {
    set({ isCreating: true, error: null });
    try {
      const newCompany = await apiService.companies.create(company);
      set(state => ({ 
        companies: [...state.companies, newCompany],
        isCreating: false 
      }));
      return newCompany;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to create company'), 
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateCompany: async (id, updates) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedCompany = await apiService.companies.update(id, updates);
      set(state => ({ 
        companies: state.companies.map(c => 
          c.id === id ? updatedCompany : c
        ),
        selectedCompany: state.selectedCompany?.id === id 
          ? updatedCompany 
          : state.selectedCompany,
        isUpdating: false 
      }));
      return updatedCompany;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to update company'), 
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteCompany: async (id) => {
    set({ isDeleting: true, error: null });
    try {
      const success = await apiService.companies.delete(id);
      if (success) {
        set(state => ({ 
          companies: state.companies.filter(c => c.id !== id),
          selectedCompany: state.selectedCompany?.id === id 
            ? null 
            : state.selectedCompany,
          isDeleting: false 
        }));
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to delete company'), 
        isDeleting: false 
      });
      throw error;
    }
  },
  
  setSelectedCompany: (company) => {
    set({ selectedCompany: company });
  },
  
  resetError: () => {
    set({ error: null });
  }
}));