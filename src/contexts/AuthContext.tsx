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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
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