import type { Database } from '@/types/database';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  // Dynamic import to prevent build-time execution
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  // Check if we have the required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Admin client for operations that need to bypass RLS
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL is required');
  }
  
  if (!serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key_here') {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured. Database operations may fail due to RLS policies. Please configure the service role key for production use.');
    // Return null to indicate admin client is not available
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper function to check if admin client is available
export function hasAdminAccess(): boolean {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!(serviceRoleKey && serviceRoleKey !== 'your_supabase_service_role_key_here');
}