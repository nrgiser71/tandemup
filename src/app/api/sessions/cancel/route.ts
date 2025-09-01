/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
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

    // Check if user is part of this session
    if ((session as any).user1_id !== user.id && (session as any).user2_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to cancel this session' },
        { status: 403 }
      );
    }

    // Check if session can be cancelled (not completed, not cancelled, and start time is more than 1 hour away)
    const sessionStart = new Date((session as any).start_time);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (sessionStart <= oneHourFromNow) {
      return NextResponse.json(
        { error: 'Cannot cancel sessions that start within 1 hour' },
        { status: 400 }
      );
    }

    if ((session as any).status === 'completed' || (session as any).status === 'cancelled') {
      return NextResponse.json(
        { error: 'Session is already completed or cancelled' },
        { status: 400 }
      );
    }

    // Update session status to cancelled
    const { error: updateError } = await (supabase as any)
      .from('sessions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel session' },
        { status: 500 }
      );
    }

    // Log the cancellation
    await (supabase as any).from('bookings').insert({
      user_id: user.id,
      session_id: sessionId,
      action: 'cancelled',
    });

    // TODO: Send cancellation emails to both users
    // TODO: Queue email notifications

    return NextResponse.json({ 
      message: 'Session cancelled successfully' 
    });
  } catch (error) {
    console.error('Cancel session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}