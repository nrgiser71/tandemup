/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('My sessions API called');
    
    const supabase = await createClient();
    
    // Get the user from the session with detailed logging
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('Auth check result:', { user: user?.id, authError: authError?.message });
    
    if (!user || authError) {
      console.log('Authorization failed:', { authError: authError?.message, hasUser: !!user });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('User authenticated successfully:', user.id);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'upcoming', 'past', or 'all'

    const now = new Date();
    // First, try the original approach with joined profiles
    let query = supabase
      .from('sessions')
      .select(`
        id,
        start_time,
        duration,
        status,
        user1_id,
        user2_id,
        jitsi_room_name,
        user1_joined,
        user2_joined,
        created_at,
        updated_at,
        user1:profiles!sessions_user1_id_fkey(id, first_name, avatar_url, language),
        user2:profiles!sessions_user2_id_fkey(id, first_name, avatar_url, language)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('start_time', { ascending: type === 'upcoming' });

    if (type === 'upcoming') {
      query = query.gte('start_time', now.toISOString());
    } else if (type === 'past') {
      query = query.lt('start_time', now.toISOString());
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 400 }
      );
    }

    // Check if we have partner profile data, if not, fetch manually due to RLS policies
    const needsPartnerFetch = sessions?.some((session: any) => 
      session.status === 'matched' && 
      ((session.user1_id === user.id && !session.user2) || 
       (session.user2_id === user.id && !session.user1))
    );

    if (needsPartnerFetch) {
      console.log('=== RLS ISSUE DETECTED - FETCHING PARTNER PROFILES MANUALLY ===');
      
      // Get unique partner IDs
      const partnerIds = new Set<string>();
      sessions?.forEach((session: any) => {
        if (session.status === 'matched') {
          const partnerId = session.user1_id === user.id ? session.user2_id : session.user1_id;
          if (partnerId) {
            partnerIds.add(partnerId);
          }
        }
      });

      console.log('Partner IDs to fetch:', Array.from(partnerIds));

      // Fetch partner profiles using admin client to bypass RLS
      const partnerProfiles = new Map();
      const adminClient = (await import('@/lib/supabase/server')).createAdminClient();
      
      if (adminClient && partnerIds.size > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, first_name, avatar_url, language')
          .in('id', Array.from(partnerIds));
        
        profiles?.forEach((profile: any) => {
          partnerProfiles.set(profile.id, profile);
        });
      }

      // Manually attach partner profiles to sessions
      sessions?.forEach((session: any) => {
        if (session.status === 'matched') {
          const isUser1 = session.user1_id === user.id;
          const partnerId = isUser1 ? session.user2_id : session.user1_id;
          
          if (partnerId && partnerProfiles.has(partnerId)) {
            const partnerProfile = partnerProfiles.get(partnerId);
            if (isUser1) {
              session.user2 = partnerProfile;
            } else {
              session.user1 = partnerProfile;
            }
          }
        }
      });

      console.log('Partner profiles fetched and attached');
    }

    // Debug logging for session data
    console.log('=== SESSION DEBUG INFO ===');
    console.log('Current user ID:', user.id);
    console.log('Raw sessions from DB:', JSON.stringify(sessions, null, 2));
    
    // Check for matched sessions specifically
    const matchedSessions = sessions?.filter((s: any) => s.status === 'matched');
    if (matchedSessions && matchedSessions.length > 0) {
      console.log('=== MATCHED SESSIONS ANALYSIS ===');
      matchedSessions.forEach((session: any, index: number) => {
        console.log(`Matched Session ${index + 1}:`);
        console.log('  - Session ID:', session.id);
        console.log('  - User1 ID:', session.user1_id);
        console.log('  - User2 ID:', session.user2_id);
        console.log('  - User1 profile data:', JSON.stringify(session.user1, null, 2));
        console.log('  - User2 profile data:', JSON.stringify(session.user2, null, 2));
        console.log('  - Is current user User1:', session.user1_id === user.id);
        console.log('  - Partner would be:', session.user1_id === user.id ? 'user2' : 'user1');
      });
    }

    // Transform the data for the frontend
    const transformedSessions = sessions?.map((session: any) => {
      const isUser1 = session.user1_id === user.id;
      const partner = isUser1 ? session.user2 : session.user1;
      const canCancel = session.status === 'waiting' || 
                       (session.status === 'matched' && new Date(session.start_time) > new Date(Date.now() + 60 * 60 * 1000));
      const canJoin = session.status === 'matched'; // Allow joining any matched session for testing

      // Debug logging for transformation
      if (session.status === 'matched') {
        console.log(`=== TRANSFORMATION DEBUG for Session ${session.id} ===`);
        console.log('  - Current user is User1:', isUser1);
        console.log('  - Raw partner object:', JSON.stringify(partner, null, 2));
        console.log('  - Partner exists:', !!partner);
        if (partner) {
          console.log('  - Partner ID:', partner.id);
          console.log('  - Partner first_name:', partner.first_name);
          console.log('  - Partner language:', partner.language);
        } else {
          console.log('  - Partner is null - checking why:');
          console.log('    - session.user1:', JSON.stringify(session.user1, null, 2));
          console.log('    - session.user2:', JSON.stringify(session.user2, null, 2));
        }
      }

      return {
        id: session.id,
        startTime: session.start_time,
        duration: session.duration,
        status: session.status,
        partner: partner ? {
          id: partner.id,
          firstName: partner.first_name,
          avatarUrl: partner.avatar_url,
          language: partner.language,
        } : null,
        jitsiRoomName: session.jitsi_room_name,
        canCancel,
        canJoin,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      };
    });

    // Debug final transformed sessions
    console.log('=== FINAL TRANSFORMED SESSIONS ===');
    const matchedTransformed = transformedSessions?.filter(s => s.status === 'matched');
    if (matchedTransformed && matchedTransformed.length > 0) {
      matchedTransformed.forEach((session, index) => {
        console.log(`Transformed Matched Session ${index + 1}:`);
        console.log('  - ID:', session.id);
        console.log('  - Status:', session.status);
        console.log('  - Partner:', JSON.stringify(session.partner, null, 2));
      });
    }

    // Separate into upcoming and past if type is 'all'
    if (type === 'all') {
      const upcoming = transformedSessions?.filter(
        session => new Date(session.startTime) >= now
      ) || [];
      const past = transformedSessions?.filter(
        session => new Date(session.startTime) < now
      ) || [];

      console.log('=== RESPONSE DEBUG ===');
      console.log('Upcoming sessions count:', upcoming.length);
      console.log('Past sessions count:', past.length);

      return NextResponse.json({ 
        data: { upcoming, past },
      });
    }

    return NextResponse.json({ 
      data: transformedSessions || [],
    });
  } catch (error) {
    console.error('My sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session to verify user ownership and timing
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if cancellation is allowed (at least 1 hour before)
    const sessionStart = new Date((session as any).start_time);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    if (sessionStart <= oneHourFromNow) {
      return NextResponse.json(
        { error: 'Cannot cancel sessions less than 1 hour before start time' },
        { status: 400 }
      );
    }

    // Cancel the session
    const { error: cancelError } = await (supabase as any)
      .from('sessions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (cancelError) {
      return NextResponse.json(
        { error: 'Failed to cancel session' },
        { status: 400 }
      );
    }

    // Log the cancellation
    await (supabase as any).from('bookings').insert({
      user_id: user.id,
      session_id: sessionId,
      action: 'cancelled',
    });

    // TODO: Send cancellation notification to partner if matched

    return NextResponse.json({ 
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}