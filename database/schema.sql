-- TandemUp Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  first_name TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'nl', 'fr')),
  timezone TEXT NOT NULL,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'past_due', 'cancelled')),
  subscription_id TEXT,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id TEXT,
  email TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  no_show_count INTEGER DEFAULT 0,
  strike_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (25, 50)),
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'completed', 'cancelled', 'no_show')),
  jitsi_room_name TEXT UNIQUE,
  user1_joined BOOLEAN DEFAULT FALSE,
  user2_joined BOOLEAN DEFAULT FALSE,
  user1_feedback TEXT,
  user2_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure users can't book the same session
  CONSTRAINT check_different_users CHECK (user1_id != user2_id),
  
  -- Ensure start_time is in the future (for new bookings)
  CONSTRAINT check_future_start_time CHECK (start_time > NOW() - INTERVAL '5 minutes')
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  reporter_id UUID REFERENCES profiles(id),
  reported_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Bookings table (for cancelled/rescheduled tracking)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES sessions(id),
  action TEXT NOT NULL CHECK (action IN ('booked', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strikes table
CREATE TABLE strikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  issued_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email queue table
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES sessions(id),
  email_type TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles USING HASH (id);
CREATE INDEX idx_profiles_subscription_status ON profiles (subscription_status);
CREATE INDEX idx_profiles_trial_ends_at ON profiles (trial_ends_at);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);

CREATE INDEX idx_sessions_start_time ON sessions (start_time);
CREATE INDEX idx_sessions_status ON sessions (status);
CREATE INDEX idx_sessions_user1_id ON sessions (user1_id);
CREATE INDEX idx_sessions_user2_id ON sessions (user2_id);
CREATE INDEX idx_sessions_waiting_for_matching ON sessions (start_time, duration, status) WHERE status = 'waiting';

CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_session_id ON reports (session_id);

CREATE INDEX idx_email_queue_status ON email_queue (status);
CREATE INDEX idx_email_queue_created_at ON email_queue (created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can view waiting sessions" ON sessions
  FOR SELECT USING (status = 'waiting' AND user2_id IS NULL);

CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for reports
CREATE POLICY "Users can view reports they created or are involved in" ON reports
  FOR SELECT USING (
    auth.uid() = reporter_id OR 
    auth.uid() = reported_id OR 
    auth.uid() IN (SELECT user1_id FROM sessions WHERE id = session_id) OR
    auth.uid() IN (SELECT user2_id FROM sessions WHERE id = session_id)
  );

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for strikes
CREATE POLICY "Users can view their own strikes" ON strikes
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for email_queue (admin only via service role)
CREATE POLICY "Service role can manage email queue" ON email_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Functions and Triggers

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, language, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to generate unique Jitsi room name
CREATE OR REPLACE FUNCTION generate_jitsi_room_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.jitsi_room_name IS NULL THEN
    NEW.jitsi_room_name := 'tandemup_' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate Jitsi room name
CREATE TRIGGER generate_jitsi_room_name_trigger
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE PROCEDURE generate_jitsi_room_name();

-- Function to match users for sessions
CREATE OR REPLACE FUNCTION match_session_users()
RETURNS TRIGGER AS $$
DECLARE
  waiting_session_id UUID;
BEGIN
  -- Only try to match if this is a new waiting session
  IF NEW.status = 'waiting' AND NEW.user2_id IS NULL THEN
    -- Find a matching waiting session
    SELECT id INTO waiting_session_id
    FROM sessions
    WHERE status = 'waiting'
      AND user2_id IS NULL
      AND user1_id != NEW.user1_id
      AND start_time = NEW.start_time
      AND duration = NEW.duration
      AND id != NEW.id
    LIMIT 1;
    
    -- If we found a match, update both sessions
    IF waiting_session_id IS NOT NULL THEN
      -- Update the existing waiting session
      UPDATE sessions
      SET user2_id = NEW.user1_id, status = 'matched', updated_at = NOW()
      WHERE id = waiting_session_id;
      
      -- Delete the new session since we matched with existing one
      DELETE FROM sessions WHERE id = NEW.id;
      
      -- Return NULL to prevent the insert
      RETURN NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic matching
CREATE TRIGGER auto_match_sessions
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE PROCEDURE match_session_users();