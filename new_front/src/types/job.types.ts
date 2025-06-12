// types/job.types.ts

import { Company } from './company.types';
import { ContractType, JobStatus, JobType, ExperienceLevel, ProficiencyLevel } from './enums';

export interface Job {
  id: string;
  company_id: string;
  posted_by: string;
  assigned_consultant_id?: string | null;
  title: string;
  description: string;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  location: string;
  contract_type: ContractType;
  job_type?: JobType | null;
  experience_level?: ExperienceLevel | null;
  is_remote: boolean;
  is_hybrid: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  status: JobStatus;
  posting_date?: string | null;
  deadline_date?: string | null;
  benefits?: string[] | null;
  company_culture?: string | null;
  requires_cover_letter: boolean;
  internal_notes?: string | null;
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  company?: Company;
  skill_requirements?: JobSkillRequirement[];
}

export interface JobSkillRequirement {
  id: string;
  job_id: string;
  skill_id: string;
  is_required: boolean;
  proficiency_level?: ProficiencyLevel | null;
  years_experience?: number | null;
  skill_name?: string;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  title: string;
  description: string;
  company_id: string;
  responsibilities?: string[] | null;
  requirements?: string[] | null;
  location: string;
  contract_type: ContractType;
  job_type?: JobType | null;
  experience_level?: ExperienceLevel | null;
  is_remote?: boolean;
  is_hybrid?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  benefits?: string[] | null;
  company_culture?: string | null;
  requires_cover_letter?: boolean;
  deadline_date?: string | null;
}

export interface JobUpdate extends Partial<JobCreate> {
  status?: JobStatus;
  is_featured?: boolean;
  internal_notes?: string | null;
}

export interface JobSearchFilters {
  query?: string | null;
  company_id?: string | null;
  status?: JobStatus | null;
  contract_type?: ContractType | null;
  job_type?: JobType | null;
  experience_level?: ExperienceLevel | null;
  location?: string | null;
  is_remote?: boolean | null;
  is_featured?: boolean | null;
  salary_min?: number | null;
  salary_max?: number | null;
  skills?: string[] | null;
  posted_after?: string | null;
  posted_before?: string | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface JobListResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

