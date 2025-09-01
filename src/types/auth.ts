// Authentication related types

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  language: 'en' | 'nl' | 'fr';
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
  firstName?: string;
  language?: 'en' | 'nl' | 'fr';
  timezone?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: any | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
}