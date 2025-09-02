/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // Check if session is already cancelled or completed
    if ((session as any).status === 'cancelled') {
      return NextResponse.json(
        { error: 'Session is already cancelled' },
        { status: 400 }
      );
    }

    if ((session as any).status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed sessions' },
        { status: 400 }
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
      console.error('Failed to cancel session:', cancelError);
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