/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'upcoming', 'past', or 'all'

    const now = new Date();
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
        user1:profiles!sessions_user1_id_fkey(id, first_name, avatar_url),
        user2:profiles!sessions_user2_id_fkey(id, first_name, avatar_url)
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
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 400 }
      );
    }

    // Transform the data for the frontend
    const transformedSessions = sessions?.map((session: any) => {
      const isUser1 = session.user1_id === user.id;
      const partner = isUser1 ? session.user2 : session.user1;
      const canCancel = session.status === 'waiting' || 
                       (session.status === 'matched' && new Date(session.start_time) > new Date(Date.now() + 60 * 60 * 1000));
      const canJoin = session.status === 'matched' && 
                     new Date(session.start_time) <= new Date(Date.now() + 5 * 60 * 1000) &&
                     new Date(session.start_time) > new Date(Date.now() - 5 * 60 * 1000);

      return {
        id: session.id,
        startTime: session.start_time,
        duration: session.duration,
        status: session.status,
        partner: partner ? {
          id: partner.id,
          firstName: partner.first_name,
          avatarUrl: partner.avatar_url,
        } : null,
        jitsiRoomName: session.jitsi_room_name,
        canCancel,
        canJoin,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      };
    });

    // Separate into upcoming and past if type is 'all'
    if (type === 'all') {
      const upcoming = transformedSessions?.filter(
        session => new Date(session.startTime) >= now
      ) || [];
      const past = transformedSessions?.filter(
        session => new Date(session.startTime) < now
      ) || [];

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

    if (authError || !user) {
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