// types/candidate.types.ts

import { ProficiencyLevel } from './enums';

export interface CandidateProfile {
  id: string;
  user_id: string;
  current_position?: string | null;
  current_company?: string | null;
  summary?: string | null;
  years_of_experience?: number | null;
  nationality?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  postal_code?: string | null;
  profile_completed: boolean;
  profile_visibility: string;
  is_open_to_opportunities: boolean;
  cv_urls?: string[] | null;
  cover_letter_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  website?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateEducation {
  id: string;
  candidate_id: string;
  institution: string;
  degree: string;
  field_of_study?: string | null;
  start_date: string;
  end_date?: string | null;
  grade?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateExperience {
  id: string;
  candidate_id: string;
  job_title: string;
  company: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  description?: string | null;
  achievements?: string[] | null;
  technologies_used?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateSkill {
  id: string;
  candidate_id: string;
  skill_id: string;
  skill_name?: string;
  proficiency_level?: ProficiencyLevel | null;
  years_experience?: number | null;
  is_primary: boolean;
  certifications?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateJobPreference {
  id: string;
  candidate_id: string;
  job_types?: string[] | null;
  industries?: string[] | null;
  locations?: string[] | null;
  remote_work?: boolean | null;
  salary_expectation_min?: number | null;
  salary_expectation_max?: number | null;
  availability_date?: string | null;
  willing_to_relocate?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateNotificationSettings {
  id: string;
  candidate_id: string;
  email_alerts: boolean;
  job_matches: boolean;
  application_updates: boolean;
  created_at: string;
  updated_at: string;
}

// Request/Response types
export interface CandidateProfileCreate {
  user_id?: string;
  current_position?: string | null;
  current_company?: string | null;
  summary?: string | null;
  years_of_experience?: number | null;
  nationality?: string | null;
  location?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  postal_code?: string | null;
}

export interface CandidateProfileUpdate extends Partial<CandidateProfileCreate> {
  profile_visibility?: string;
  is_open_to_opportunities?: boolean;
  cv_urls?: string[] | null;
  cover_letter_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  website?: string | null;
}

export interface EducationCreate {
  institution: string;
  degree: string;
  field_of_study?: string | null;
  start_date: string;
  end_date?: string | null;
  grade?: string | null;
  description?: string | null;
}

export interface WorkExperienceCreate {
  job_title: string;
  company: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  description?: string | null;
  achievements?: string[] | null;
  technologies_used?: string[] | null;
}

export interface CandidateSkillUpdate {
  skill_id: string;
  proficiency_level?: ProficiencyLevel | null;
  years_experience?: number | null;
}

export interface CandidateSearchFilters {
  query?: string | null;
  skills?: string[] | null;
  locations?: string[] | null;
  experience_min?: number | null;
  experience_max?: number | null;
  education_level?: string | null;
  languages?: string[] | null;
  availability?: string | null;
  is_active?: boolean | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface CandidateListResponse {
  items: CandidateProfile[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}