// Authentication related types
import { Profile, LanguageCode, Languages } from './database';

// Supabase User type - simplified version
export interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  languages: Languages;
  timezone: string;
  acceptTerms: boolean;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface ProfileUpdate {
  first_name?: string;
  languages?: Languages;
  timezone?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}