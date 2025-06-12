// types/common.types.ts

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface CommonFilters {
  q?: string | null;
  sort_by?: string | null;
  order?: 'asc' | 'desc';
  is_active?: boolean | null;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status?: number;
  type?: string;
}

export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  page_size?: number;
}

export interface FileUploadResponse {
  url: string;
  file_name: string;
  file_size: number;
  content_type: string;
}

