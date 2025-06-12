
// api/company.api.ts

import { apiRequest } from './config';
import {
  Company,
  CompanyCreate,
  CompanyUpdate,
  CompanySearchFilters,
  CompanyListResponse,
} from '@/types/company.types';

export const companyApi = {
  // List and search
  listCompanies: async (filters?: CompanySearchFilters): Promise<CompanyListResponse> => {
    return apiRequest('get', '/companies', { params: filters });
  },
  
  searchCompanies: async (query: string, filters?: CompanySearchFilters): Promise<CompanyListResponse> => {
    return apiRequest('get', '/companies', { 
      params: { q: query, ...filters } 
    });
  },
  
  getCompanyById: async (id: string): Promise<Company> => {
    return apiRequest('get', `/companies/${id}`);
  },
  
  // Create and update (admin/employer)
  createCompany: async (data: CompanyCreate): Promise<Company> => {
    return apiRequest('post', '/companies', data);
  },
  
  updateCompany: async (id: string, data: CompanyUpdate): Promise<Company> => {
    return apiRequest('put', `/companies/${id}`, data);
  },
  
  deleteCompany: async (id: string): Promise<void> => {
    await apiRequest('delete', `/companies/${id}`);
  },
  
  // Company jobs
  getCompanyJobs: async (companyId: string): Promise<any> => {
    return apiRequest('get', `/companies/${companyId}/jobs`);
  },
  
  // Company statistics
  getCompanyStats: async (companyId: string): Promise<any> => {
    return apiRequest('get', `/companies/${companyId}/stats`);
  },
  
  // Logo upload
  uploadCompanyLogo: async (companyId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest<{ url: string }>('post', `/companies/${companyId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.url;
  },
};

