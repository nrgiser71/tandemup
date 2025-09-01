// Database types matching the PRD schema

export interface Profile {
  id: string;
  first_name: string;
  language: 'en' | 'nl' | 'fr';
  timezone: string;
  avatar_url?: string;
  subscription_status: 'trial' | 'active' | 'inactive' | 'past_due' | 'cancelled';
  subscription_id?: string;
  subscription_ends_at?: string;
  trial_ends_at?: string;
  stripe_customer_id?: string;
  email: string;
  total_sessions: number;
  no_show_count: number;
  strike_count: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  start_time: string;
  duration: 25 | 50;
  user1_id?: string;
  user2_id?: string;
  status: 'waiting' | 'matched' | 'completed' | 'cancelled' | 'no_show';
  jitsi_room_name?: string;
  user1_joined: boolean;
  user2_joined: boolean;
  user1_feedback?: string;
  user2_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  session_id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description?: string;
  screenshot_url?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  action: 'booked' | 'cancelled' | 'rescheduled';
  created_at: string;
}

export interface Strike {
  id: string;
  user_id: string;
  reason: string;
  description?: string;
  issued_by: string;
  expires_at?: string;
  created_at: string;
}

export interface EmailQueue {
  id: string;
  to_email: string;
  template: string;
  variables: Record<string, string | number | boolean>;
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  created_at: string;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at' | 'updated_at'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'>;
        Update: Partial<Omit<Report, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      strikes: {
        Row: Strike;
        Insert: Omit<Strike, 'id' | 'created_at'>;
        Update: Partial<Omit<Strike, 'id' | 'created_at'>>;
      };
      email_queue: {
        Row: EmailQueue;
        Insert: Omit<EmailQueue, 'id' | 'created_at'>;
        Update: Partial<Omit<EmailQueue, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}