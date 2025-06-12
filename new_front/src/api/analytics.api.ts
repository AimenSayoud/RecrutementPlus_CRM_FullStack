// api/analytics.api.ts

import { apiRequest } from './config';

interface DateRange {
  start_date?: string;
  end_date?: string;
}

interface AnalyticsFilters extends DateRange {
  group_by?: 'day' | 'week' | 'month' | 'year';
  metric_type?: string;
}

export const analyticsApi = {
  // Overview
  getOverviewMetrics: async (dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/overview', { params: dateRange });
  },
  
  // Recruitment metrics
  getRecruitmentMetrics: async (filters?: AnalyticsFilters): Promise<any> => {
    return apiRequest('get', '/analytics/recruitment', { params: filters });
  },
  
  // Job analytics
  getJobAnalytics: async (companyId?: string, dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/jobs', {
      params: { company_id: companyId, ...dateRange },
    });
  },
  
  getJobPerformance: async (jobId: string): Promise<any> => {
    return apiRequest('get', `/analytics/jobs/${jobId}/performance`);
  },
  
  // Application analytics
  getApplicationAnalytics: async (filters?: AnalyticsFilters & {
    company_id?: string;
    job_id?: string;
    consultant_id?: string;
  }): Promise<any> => {
    return apiRequest('get', '/analytics/applications', { params: filters });
  },
  
  getApplicationFunnel: async (jobId?: string, dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/applications/funnel', {
      params: { job_id: jobId, ...dateRange },
    });
  },
  
  // Candidate analytics
  getCandidateAnalytics: async (filters?: AnalyticsFilters): Promise<any> => {
    return apiRequest('get', '/analytics/candidates', { params: filters });
  },
  
  getCandidateSourceAnalytics: async (dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/candidates/sources', { params: dateRange });
  },
  
  // Consultant analytics
  getConsultantAnalytics: async (consultantId?: string, dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/consultants', {
      params: { consultant_id: consultantId, ...dateRange },
    });
  },
  
  getConsultantLeaderboard: async (period?: string): Promise<any> => {
    return apiRequest('get', '/analytics/consultants/leaderboard', { params: { period } });
  },
  
  // Company analytics
  getCompanyAnalytics: async (companyId?: string, dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/companies', {
      params: { company_id: companyId, ...dateRange },
    });
  },
  
  // Skills analytics
  getSkillsAnalytics: async (dateRange?: DateRange): Promise<any> => {
    return apiRequest('get', '/analytics/skills', { params: dateRange });
  },
  
  getSkillDemandTrends: async (skillIds?: string[], period?: string): Promise<any> => {
    return apiRequest('get', '/analytics/skills/trends', {
      params: { skill_ids: skillIds?.join(','), period },
    });
  },
  
  // Export analytics
  exportAnalytics: async (type: string, filters: any): Promise<Blob> => {
    const response = await apiRequest('post', `/analytics/export/${type}`, filters, {
      responseType: 'blob',
    });
    return response as Blob;
  },
};