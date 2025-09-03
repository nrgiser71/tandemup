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

    // Get matched sessions for the current user to debug partner issue
    const { data: matchedSessions, error: matchedError } = await supabase
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
        user1:profiles!sessions_user1_id_fkey(id, first_name, avatar_url, language),
        user2:profiles!sessions_user2_id_fkey(id, first_name, avatar_url, language)
      `)
      .eq('status', 'matched')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
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

    // Analyze the matched sessions data
    const analysis = matchedSessions?.map(session => {
      const isUser1 = session.user1_id === user.id;
      const partner = isUser1 ? session.user2 : session.user1;
      
      return {
        sessionId: session.id,
        isCurrentUserUser1: isUser1,
        user1_id: session.user1_id,
        user2_id: session.user2_id,
        user1_data: session.user1,
        user2_data: session.user2,
        determined_partner: partner,
        partner_issues: {
          partner_is_null: partner === null,
          user1_missing: session.user1 === null,
          user2_missing: session.user2 === null,
        }
      };
    });

    return NextResponse.json({
      debug: {
        currentUser: {
          id: user.id,
          email: user.email,
          profile: currentUserProfile
        },
        database: {
          matchedError: matchedError?.message,
          matchedSessionsFound: matchedSessions?.length || 0,
          matchedSessions: matchedSessions || [],
          allProfiles: allProfiles || [],
          analysis
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