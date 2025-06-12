// types/consultant.types.ts

import { ConsultantStatus } from './enums';

export interface ConsultantProfile {
  id: string;
  user_id: string;
  employee_id?: string | null;
  department?: string | null;
  specializations?: string[] | null;
  status: ConsultantStatus;
  commission_rate?: number | null;
  is_team_lead: boolean;
  manager_id?: string | null;
  hire_date?: string | null;
  performance_rating?: number | null;
  total_placements: number;
  successful_placements: number;
  active_candidates: number;
  active_clients: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultantProfileUpdate {
  department?: string | null;
  specializations?: string[] | null;
  commission_rate?: number | null;
  notes?: string | null;
}

export interface ConsultantTarget {
  id: string;
  consultant_id: string;
  period: string;
  year: number;
  placement_target: number;
  revenue_target?: number | null;
  interview_target?: number | null;
  client_meeting_target?: number | null;
  actual_placements: number;
  actual_revenue?: number | null;
  actual_interviews: number;
  actual_client_meetings: number;
  created_at: string;
  updated_at: string;
}

export interface ConsultantPerformanceReview {
  id: string;
  consultant_id: string;
  reviewer_id: string;
  review_period: string;
  performance_score: number;
  placement_score?: number | null;
  client_satisfaction_score?: number | null;
  candidate_satisfaction_score?: number | null;
  strengths?: string[] | null;
  areas_for_improvement?: string[] | null;
  goals?: string[] | null;
  comments?: string | null;
  created_at: string;
}

export interface ConsultantCandidate {
  id: string;
  consultant_id: string;
  candidate_id: string;
  status: string;
  assigned_date: string;
  last_contact_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  candidate?: any;
}

export interface ConsultantClient {
  id: string;
  consultant_id: string;
  company_id: string;
  is_primary: boolean;
  assigned_date: string;
  relationship_score?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  company?: any;
}

export interface ConsultantSearchFilters {
  query?: string | null;
  status?: ConsultantStatus | null;
  department?: string | null;
  manager_id?: string | null;
  specialization?: string | null;
  performance_rating_min?: number | null;
  is_team_lead?: boolean | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface ConsultantListResponse {
  items: ConsultantProfile[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}