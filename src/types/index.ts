// Re-export all types for easy importing
export * from './database';
export * from './auth';
export * from './booking';

// Common utility types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface Language {
  code: 'en' | 'nl' | 'fr';
  name: string;
}

export interface Timezone {
  value: string;
  label: string;
  offset: string;
}