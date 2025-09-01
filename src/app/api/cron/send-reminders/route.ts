/* eslint-disable @typescript-eslint/no-explicit-any */import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateSessionReminderEmail } from '@/lib/mailgun';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get current time and 15 minutes from now
    const now = new Date();
    const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    const reminderTimeStr = reminderTime.toISOString();
    
    // Find sessions starting in approximately 15 minutes that need reminders
    const { data: sessionsNeedingReminders, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        start_time,
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
      .eq('status', 'confirmed')
      .gte('start_time', now.toISOString())
      .lte('start_time', reminderTimeStr);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!sessionsNeedingReminders || sessionsNeedingReminders.length === 0) {
      return NextResponse.json({ 
        message: 'No sessions need reminders at this time',
        processed: 0
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const session of sessionsNeedingReminders) {
      // Check if we already sent reminders for this session
      const { data: existingReminders } = await supabase
        .from('email_queue')
        .select('id')
        .eq('session_id', (session as any).id)
        .eq('email_type', 'session_reminder')
        .eq('status', 'sent');

      if (existingReminders && existingReminders.length > 0) {
        continue; // Skip if reminders already sent
      }

      const sessionTime = new Date((session as any).start_time).toLocaleString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam'
      });

      // Send reminder to each participant
      for (const booking of (session as any).bookings) {
        if (!booking.profiles?.email || !booking.profiles?.first_name) {
          continue;
        }

        const { subject, html } = generateSessionReminderEmail(
          booking.profiles.first_name,
          sessionTime,
          (session as any).duration_minutes
        );

        // Add to email queue first
        const { error: queueError } = await (supabase as any)
          .from('email_queue')
          .insert({
            user_id: booking.user_id,
            session_id: (session as any).id,
            email_type: 'session_reminder',
            to_email: booking.profiles.email,
            subject,
            html_content: html,
            status: 'pending'
          });

        if (queueError) {
          console.error('Error adding email to queue:', queueError);
          errors.push(`Failed to queue email for user ${booking.user_id}`);
          continue;
        }

        // Send the email
        const emailResult = await sendEmail({
          to: booking.profiles.email,
          subject,
          html
        });

        if (emailResult.success) {
          // Mark as sent in queue
          await (supabase as any)
            .from('email_queue')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('user_id', booking.user_id)
            .eq('session_id', (session as any).id)
            .eq('email_type', 'session_reminder');

          emailsSent++;
        } else {
          // Mark as failed in queue
          await (supabase as any)
            .from('email_queue')
            .update({ 
              status: 'failed',
              error_message: emailResult.error?.toString()
            })
            .eq('user_id', booking.user_id)
            .eq('session_id', (session as any).id)
            .eq('email_type', 'session_reminder');

          errors.push(`Failed to send email to ${booking.profiles.email}`);
        }
      }
    }

    return NextResponse.json({
      message: `Processed ${sessionsNeedingReminders.length} sessions`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in send-reminders cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}