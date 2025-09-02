/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Profile, SignUpData, SignInData, ResetPasswordData } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signUp: (data: SignUpData) => Promise<{ error?: AuthError }>;
  signIn: (data: SignInData) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<{ error?: AuthError }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: Error }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Get initial session with timeout and retry logic
    const getInitialSession = async () => {
      try {
        setError(null);
        console.log('AuthContext: Starting initial session check...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 10000);
        });
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        console.log('AuthContext: Session check complete:', !!session?.user);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);
        setRetryCount(0);
      } catch (error: any) {
        console.error('AuthContext: Initial session check failed:', error);
        setError(error.message || 'Failed to connect to authentication service');
        
        // Exponential backoff retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        
        if (retryCount < 3) {
          console.log(`AuthContext: Retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          console.log('AuthContext: Max retries reached, stopping loading');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, !!session?.user);
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, [retryCount]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) throw error;
      setProfile(data);
      console.log('AuthContext: Profile fetched successfully');
    } catch (error: any) {
      console.error('AuthContext: Error fetching profile:', error);
      // Don't fail the entire auth process if profile fetch fails
      setProfile(null);
    }
  };

  const retry = () => {
    console.log('AuthContext: Manual retry initiated');
    setLoading(true);
    setError(null);
    setRetryCount(0);
  };

  const signUp = async (data: SignUpData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          language: data.language,
          timezone: data.timezone,
        },
      },
    });

    return { error: error || undefined };
  };

  const signIn = async (data: SignInData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    return { error: error || undefined };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (data: ResetPasswordData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error: error || undefined };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error } = await (supabase as any).from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (error) throw error;

      // Refresh profile data
      await fetchProfile(user.id);

      return {};
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    retry,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};