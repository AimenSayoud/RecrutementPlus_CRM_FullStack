// api/consultant.api.ts

import { apiRequest } from './config';
import {
  ConsultantProfile,
  ConsultantProfileUpdate,
  ConsultantTarget,
  ConsultantPerformanceReview,
  ConsultantCandidate,
  ConsultantClient,
  ConsultantSearchFilters,
  ConsultantListResponse,
} from '@/types/consultant.types';

export const consultantApi = {
  // Profile
  getMyProfile: async (): Promise<ConsultantProfile> => {
    return apiRequest('get', '/consultants/me');
  },
  
  updateMyProfile: async (data: ConsultantProfileUpdate): Promise<ConsultantProfile> => {
    return apiRequest('put', '/consultants/me', data);
  },
  
  // Targets
  getMyTargets: async (period?: string): Promise<ConsultantTarget[]> => {
    return apiRequest('get', '/consultants/me/targets', { params: { period } });
  },
  
  getCurrentTarget: async (): Promise<ConsultantTarget> => {
    return apiRequest('get', '/consultants/me/targets/current');
  },
  
  // Performance
  getMyPerformanceReviews: async (): Promise<ConsultantPerformanceReview[]> => {
    return apiRequest('get', '/consultants/me/performance-reviews');
  },
  
  getPerformanceStats: async (dateFrom?: string, dateTo?: string): Promise<any> => {
    return apiRequest('get', '/consultants/me/performance-stats', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
  },
  
  // Assigned candidates
  getAssignedCandidates: async (status?: string): Promise<ConsultantCandidate[]> => {
    return apiRequest('get', '/consultants/me/candidates', { params: { status } });
  },
  
  assignCandidate: async (candidateId: string, notes?: string): Promise<ConsultantCandidate> => {
    return apiRequest('post', '/consultants/me/candidates', {
      candidate_id: candidateId,
      notes,
    });
  },
  
  updateCandidateStatus: async (
    candidateId: string,
    status: string,
    notes?: string
  ): Promise<ConsultantCandidate> => {
    return apiRequest('put', `/consultants/me/candidates/${candidateId}`, {
      status,
      notes,
    });
  },
  
  // Assigned clients
  getAssignedClients: async (): Promise<ConsultantClient[]> => {
    return apiRequest('get', '/consultants/me/clients');
  },
  
  // Admin endpoints
  searchConsultants: async (filters?: ConsultantSearchFilters): Promise<ConsultantListResponse> => {
    return apiRequest('get', '/consultants', { params: filters });
  },
  
  getConsultantById: async (id: string): Promise<ConsultantProfile> => {
    return apiRequest('get', `/consultants/${id}`);
  },
  
  createConsultant: async (data: any): Promise<ConsultantProfile> => {
    return apiRequest('post', '/consultants', data);
  },
  
  updateConsultantStatus: async (id: string, status: string, reason?: string): Promise<ConsultantProfile> => {
    return apiRequest('post', `/consultants/${id}/status`, { status, reason });
  },
  
  setConsultantTargets: async (id: string, targets: any): Promise<ConsultantTarget> => {
    return apiRequest('post', `/consultants/${id}/targets`, targets);
  },
};