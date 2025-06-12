// types/skill.types.ts

export interface Skill {
  id: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  skill_type?: string | null;
  is_verified: boolean;
  is_trending: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: SkillCategory | null;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SkillCreate {
  name: string;
  description?: string | null;
  category_id?: string | null;
  skill_type?: string | null;
}

export interface SkillUpdate extends Partial<SkillCreate> {
  is_verified?: boolean;
  is_trending?: boolean;
}

export interface SkillSearchFilters {
  query?: string | null;
  category_id?: string | null;
  skill_type?: string | null;
  is_verified?: boolean | null;
  is_trending?: boolean | null;
  page?: number;
  page_size?: number;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}