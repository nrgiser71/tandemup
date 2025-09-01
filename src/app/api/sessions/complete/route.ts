import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateSessionCompletedEmail } from '@/lib/mailgun';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session with participants
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        duration_minutes,
        status,
        bookings (
          user_id,
          profiles (
            id,
            first_name,
            email
          )
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is a participant
    const isParticipant = session.bookings.some(booking => booking.user_id === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized for this session' }, { status: 403 });
    }

    // Mark session as completed
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
    }

    // Send completion emails to all participants
    for (const booking of session.bookings) {
      if (!booking.profiles?.email || !booking.profiles?.first_name) {
        continue;
      }

      // Get partner name (other participant)
      const otherParticipants = session.bookings
        .filter(b => b.user_id !== booking.user_id)
        .map(b => b.profiles?.first_name)
        .filter(Boolean);
      
      const partnerName = otherParticipants.length > 0 ? otherParticipants[0] : undefined;

      const { subject, html } = generateSessionCompletedEmail(
        booking.profiles.first_name,
        session.duration_minutes,
        partnerName
      );

      // Add to email queue
      await supabase
        .from('email_queue')
        .insert({
          user_id: booking.user_id,
          session_id: sessionId,
          email_type: 'session_completed',
          to_email: booking.profiles.email,
          subject,
          html_content: html,
          status: 'pending'
        });

      // Send the email
      const emailResult = await sendEmail({
        to: booking.profiles.email,
        subject,
        html
      });

      if (emailResult.success) {
        // Mark as sent in queue
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('user_id', booking.user_id)
          .eq('session_id', sessionId)
          .eq('email_type', 'session_completed')
          .eq('status', 'pending');
      } else {
        // Mark as failed in queue
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            error_message: emailResult.error?.toString()
          })
          .eq('user_id', booking.user_id)
          .eq('session_id', sessionId)
          .eq('email_type', 'session_completed')
          .eq('status', 'pending');
      }
    }

    return NextResponse.json({
      message: 'Session completed successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}