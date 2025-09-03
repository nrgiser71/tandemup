/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all sessions for the date (not just waiting/matched)
    const { data: allSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        status,
        user1_id,
        user2_id,
        created_at,
        updated_at,
        user1_profile:profiles!sessions_user1_id_fkey(first_name, last_name, language, email),
        user2_profile:profiles!sessions_user2_id_fkey(first_name, last_name, language, email)
      `)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time');

    // Get current user profile
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get all profiles for reference
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, language, email, created_at');

    return NextResponse.json({
      debug: {
        currentUser: {
          id: user.id,
          email: user.email,
          profile: currentUserProfile
        },
        dateRange: {
          date,
          startOfDay: startOfDay.toISOString(),
          endOfDay: endOfDay.toISOString()
        },
        database: {
          sessionsError: sessionsError?.message,
          sessionsFound: allSessions?.length || 0,
          sessions: allSessions || [],
          allProfiles: allProfiles || []
        }
      }
    });
  } catch (error) {
    console.error('Debug sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}