import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance for the browser
function createSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

// Factory function that returns a new client instance
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export type SupabaseClient = typeof supabase;