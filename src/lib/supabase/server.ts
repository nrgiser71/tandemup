import type { Database } from '@/types/database';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

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

  // Get authorization header
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  console.log('Creating Supabase server client:', {
    hasAuthHeader: !!authHeader,
    authHeaderType: authHeader?.substring(0, 20) + '...',
    cookieCount: cookieStore.getAll().length
  });

  // Create the server client with both cookie and header auth support
  const client = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = cookieStore.getAll();
          console.log('Getting cookies:', cookies.map(c => c.name));
          return cookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('Setting cookie:', name);
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn('Failed to set cookies:', error);
          }
        },
      },
      // Pass Authorization header if present for Bearer token auth
      ...(authHeader && {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }),
    }
  );

  // If we have a Bearer token, set the session manually
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    console.log('Attempting to set session from Bearer token');
    try {
      // Set the session using the access token
      await client.auth.setSession({
        access_token: token,
        refresh_token: '', // We don't have the refresh token from Bearer auth
      });
      console.log('Successfully set session from Bearer token');
    } catch (error) {
      console.warn('Failed to set session from Bearer token:', error);
      // Continue with cookie-based auth as fallback
    }
  }

  return client;
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