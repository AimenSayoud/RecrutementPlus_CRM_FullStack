// types/company.types.ts

import { CompanySize } from './enums';

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  size?: CompanySize | null;
  company_size?: CompanySize | null;
  location?: string | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;
  founded_year?: number | null;
  registration_number?: string | null;
  tax_id?: string | null;
  cover_image_url?: string | null;
  social_media?: Record<string, string> | null;
  is_verified: boolean;
  is_premium: boolean;
  notes?: string | null;
  total_employees?: number | null;
  active_jobs?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  company_id: string;
  position?: string | null;
  department?: string | null;
  contact_info?: Record<string, any> | null;
  is_hiring_manager: boolean;
  can_post_jobs: boolean;
  is_primary_contact: boolean;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  company?: Company;
}

export interface CompanyCreate {
  name: string;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  company_size?: CompanySize | null;
  founded_year?: number | null;
}

export interface CompanyUpdate extends Partial<CompanyCreate> {
  logo_url?: string | null;
  cover_image_url?: string | null;
  social_media?: Record<string, string> | null;
  is_verified?: boolean;
  is_premium?: boolean;
}

export interface CompanySearchFilters {
  query?: string | null;
  industry?: string | null;
  size?: CompanySize | null;
  location?: string | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface CompanyListResponse {
  items: Company[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}