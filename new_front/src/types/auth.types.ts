// types/auth.types.ts

export enum UserRole {
  CANDIDATE = 'candidate',
  EMPLOYER = 'employer',
  CONSULTANT = 'consultant',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  phone?: string | null;
  created_at: string;
  last_login?: string | null;
  full_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthStatusResponse {
  is_authenticated: boolean;
  user?: User | null;
}