// api/application.api.ts

import { apiRequest } from './config';
import {
  Application,
  ApplicationCreate,
  ApplicationUpdate,
  ApplicationStatusChange,
  ApplicationNote,
  ApplicationSearchFilters,
  ApplicationListResponse,
} from '@/types/application.types';

export const applicationApi = {
  // List and search
  listApplications: async (filters?: ApplicationSearchFilters): Promise<ApplicationListResponse> => {
    return apiRequest('get', '/applications', { params: filters });
  },
  
  getApplicationById: async (id: string): Promise<Application> => {
    return apiRequest('get', `/applications/${id}`);
  },
  
  // Create application (candidate)
  applyToJob: async (data: ApplicationCreate): Promise<Application> => {
    return apiRequest('post', '/applications', data);
  },
  
  updateApplication: async (id: string, data: ApplicationUpdate): Promise<Application> => {
    return apiRequest('put', `/applications/${id}`, data);
  },
  
  withdrawApplication: async (id: string): Promise<void> => {
    await apiRequest('post', `/applications/${id}/withdraw`);
  },
  
  // Status changes (employer/consultant)
  changeApplicationStatus: async (id: string, data: ApplicationStatusChange): Promise<Application> => {
    return apiRequest('post', `/applications/${id}/status`, data);
  },
  
  // Notes (consultant/employer)
  getApplicationNotes: async (applicationId: string): Promise<ApplicationNote[]> => {
    return apiRequest('get', `/applications/${applicationId}/notes`);
  },
  
  addApplicationNote: async (applicationId: string, noteText: string, isPrivate?: boolean): Promise<ApplicationNote> => {
    return apiRequest('post', `/applications/${applicationId}/notes`, {
      note_text: noteText,
      is_private: isPrivate,
    });
  },
  
  updateApplicationNote: async (applicationId: string, noteId: string, noteText: string): Promise<ApplicationNote> => {
    return apiRequest('put', `/applications/${applicationId}/notes/${noteId}`, {
      note_text: noteText,
    });
  },
  
  deleteApplicationNote: async (applicationId: string, noteId: string): Promise<void> => {
    await apiRequest('delete', `/applications/${applicationId}/notes/${noteId}`);
  },
  
  // Candidate specific
  getMyApplications: async (filters?: ApplicationSearchFilters): Promise<ApplicationListResponse> => {
    return apiRequest('get', '/applications/my-applications', { params: filters });
  },
  
  // Bulk operations
  bulkUpdateStatus: async (applicationIds: string[], status: string): Promise<void> => {
    await apiRequest('post', '/applications/bulk-status', {
      application_ids: applicationIds,
      status,
    });
  },
};
