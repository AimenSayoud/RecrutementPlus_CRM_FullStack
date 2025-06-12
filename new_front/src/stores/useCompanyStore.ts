// stores/useCompanyStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { companyApi } from '@/api/company.api';
import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanySearchFilters,
} from '@/types/company.types';

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  totalCompanies: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: CompanySearchFilters;
  
  // Actions
  fetchCompanies: (filters?: CompanySearchFilters) => Promise<void>;
  searchCompanies: (query: string, filters?: CompanySearchFilters) => Promise<void>;
  fetchCompanyById: (id: string) => Promise<void>;
  createCompany: (data: CompanyCreate) => Promise<Company>;
  updateCompany: (id: string, data: CompanyUpdate) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  
  // Filters
  setFilters: (filters: Partial<CompanySearchFilters>) => void;
  clearFilters: () => void;
  
  // Pagination
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

const initialFilters: CompanySearchFilters = {
  page: 1,
  page_size: 20,
  sort_by: 'name',
  order: 'asc',
};

export const useCompanyStore = create<CompanyState>()(
  devtools(
    (set, get) => ({
      companies: [],
      currentCompany: null,
      totalCompanies: 0,
      currentPage: 1,
      pageSize: 20,
      isLoading: false,
      error: null,
      filters: initialFilters,
      
      fetchCompanies: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const response = await companyApi.listCompanies(filters || get().filters);
          set({
            companies: response.items,
            totalCompanies: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch companies', isLoading: false });
        }
      },
      
      searchCompanies: async (query, filters) => {
        set({ isLoading: true, error: null });
        try {
          const searchFilters = { ...get().filters, ...filters, query };
          const response = await companyApi.searchCompanies(query, searchFilters);
          set({
            companies: response.items,
            totalCompanies: response.total,
            currentPage: response.page,
            pageSize: response.page_size,
            filters: searchFilters,
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to search companies', isLoading: false });
        }
      },
      
      fetchCompanyById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const company = await companyApi.getCompanyById(id);
          set({ currentCompany: company, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch company', isLoading: false });
        }
      },
      
      createCompany: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const company = await companyApi.createCompany(data);
          set((state) => ({
            companies: [company, ...state.companies],
            isLoading: false,
          }));
          return company;
        } catch (error: any) {
          set({ error: error.detail || 'Failed to create company', isLoading: false });
          throw error;
        }
      },
      
      updateCompany: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const company = await companyApi.updateCompany(id, data);
          set((state) => ({
            companies: state.companies.map((c) => (c.id === id ? company : c)),
            currentCompany: state.currentCompany?.id === id ? company : state.currentCompany,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update company', isLoading: false });
          throw error;
        }
      },
      
      deleteCompany: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await companyApi.deleteCompany(id);
          set((state) => ({
            companies: state.companies.filter((c) => c.id !== id),
            currentCompany: state.currentCompany?.id === id ? null : state.currentCompany,
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete company', isLoading: false });
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
        companies: [],
        currentCompany: null,
        totalCompanies: 0,
        currentPage: 1,
        pageSize: 20,
        isLoading: false,
        error: null,
        filters: initialFilters,
      }),
    })
  )
);