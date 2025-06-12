// types/application.types.ts

import { ApplicationStatus } from './enums';

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  consultant_id?: string | null;
  cover_letter?: string | null;
  source?: string | null;
  cv_url?: string | null;
  portfolio_url?: string | null;
  source_details?: Record<string, any> | null;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at?: string | null;
  interview_scheduled_at?: string | null;
  offered_at?: string | null;
  rejected_at?: string | null;
  withdrawn_at?: string | null;
  interview_notes?: string | null;
  rejection_reason?: string | null;
  salary_expectation?: number | null;
  expected_start_date?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  job?: any;
  candidate?: any;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  comment?: string | null;
  changed_by?: string | null;
  changed_at: string;
  changed_by_name?: string | null;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  consultant_id: string;
  note_text: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  consultant_name?: string | null;
}

export interface ApplicationCreate {
  job_id: string;
  cover_letter?: string | null;
  cv_url?: string | null;
  portfolio_url?: string | null;
  source?: string | null;
  source_details?: Record<string, any> | null;
  salary_expectation?: number | null;
  expected_start_date?: string | null;
}

export interface ApplicationUpdate {
  cover_letter?: string | null;
  cv_url?: string | null;
  portfolio_url?: string | null;
  salary_expectation?: number | null;
  expected_start_date?: string | null;
}

export interface ApplicationStatusChange {
  status: ApplicationStatus;
  comment?: string | null;
  interview_scheduled_at?: string | null;
  rejection_reason?: string | null;
}

export interface ApplicationSearchFilters {
  status?: ApplicationStatus | null;
  job_id?: string | null;
  candidate_id?: string | null;
  consultant_id?: string | null;
  company_id?: string | null;
  applied_after?: string | null;
  applied_before?: string | null;
  query?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface ApplicationListResponse {
  items: Application[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

