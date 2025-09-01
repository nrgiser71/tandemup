/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to join this session
    const isParticipant = (session as any).user1_id === user.id || (session as any).user2_id === user.id;
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to join this session' },
        { status: 403 }
      );
    }

    // Check if session is matched (has both users)
    if ((session as any).status !== 'matched') {
      return NextResponse.json(
        { error: 'Session is not ready to join' },
        { status: 400 }
      );
    }

    // Check if session has started (within 5 minutes of start time)
    const sessionStart = new Date((session as any).start_time);
    const now = new Date();
    const fiveMinutesBeforeStart = new Date(sessionStart.getTime() - 5 * 60 * 1000);
    
    if (now < fiveMinutesBeforeStart) {
      return NextResponse.json(
        { error: 'Session has not started yet' },
        { status: 400 }
      );
    }

    // Update user's joined status
    const isUser1 = (session as any).user1_id === user.id;
    const updateField = isUser1 ? 'user1_joined' : 'user2_joined';
    
    const { error: updateError } = await (supabase as any)
      .from('sessions')
      .update({
        [updateField]: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Successfully joined session',
      jitsiRoomName: (session as any).jitsi_room_name
    });
  } catch (error) {
    console.error('Join session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}