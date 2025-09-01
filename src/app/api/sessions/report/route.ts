import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
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
    const { sessionId, reportedUserId, reason, description } = body;

    if (!sessionId || !reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the session to verify user is part of it
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
    const isParticipant = session.user1_id === user.id || session.user2_id === user.id;
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Not authorized to report on this session' },
        { status: 403 }
      );
    }

    // Check if reported user is also part of the session
    const isReportedUserParticipant = session.user1_id === reportedUserId || session.user2_id === reportedUserId;
    
    if (!isReportedUserParticipant) {
      return NextResponse.json(
        { error: 'Reported user is not part of this session' },
        { status: 400 }
      );
    }

    // Can't report yourself
    if (user.id === reportedUserId) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      );
    }

    // Create the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        session_id: sessionId,
        reporter_id: user.id,
        reported_id: reportedUserId,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (reportError) {
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    // TODO: Temporarily suspend reported user if this is a serious violation
    // TODO: Send notification to admin
    // TODO: Queue email notification

    return NextResponse.json({ 
      message: 'Report submitted successfully',
      reportId: report.id
    });
  } catch (error) {
    console.error('Report session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}