/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateTrialExpiryEmail } from '@/lib/mailgun';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get users whose trial expires in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999); // End of that day
    
    const startOfTargetDay = new Date(threeDaysFromNow);
    startOfTargetDay.setHours(0, 0, 0, 0); // Start of that day

    const { data: usersWithExpiringTrials, error: usersError } = await supabase
      .from('profiles')
      .select('id, first_name, email, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', startOfTargetDay.toISOString())
      .lte('trial_ends_at', threeDaysFromNow.toISOString());

    if (usersError) {
      console.error('Error fetching users with expiring trials:', usersError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!usersWithExpiringTrials || usersWithExpiringTrials.length === 0) {
      return NextResponse.json({ 
        message: 'No trials expiring in 3 days',
        processed: 0
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of usersWithExpiringTrials) {
      if (!(user as any).email || !(user as any).first_name) {
        continue;
      }

      // Check if we already sent a trial expiry warning for this user
      const { data: existingEmails } = await supabase
        .from('email_queue')
        .select('id')
        .eq('user_id', (user as any).id)
        .eq('email_type', 'trial_expiry_warning')
        .eq('status', 'sent');

      if (existingEmails && existingEmails.length > 0) {
        continue; // Skip if warning already sent
      }

      const { subject, html } = generateTrialExpiryEmail((user as any).first_name);

      // Add to email queue first
      const { error: queueError } = await (supabase as any)
        .from('email_queue')
        .insert({
          user_id: (user as any).id,
          email_type: 'trial_expiry_warning',
          to_email: (user as any).email,
          subject,
          html_content: html,
          status: 'pending'
        });

      if (queueError) {
        console.error('Error adding email to queue:', queueError);
        errors.push(`Failed to queue email for user ${(user as any).id}`);
        continue;
      }

      // Send the email
      const emailResult = await sendEmail({
        to: (user as any).email,
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
          .eq('user_id', (user as any).id)
          .eq('email_type', 'trial_expiry_warning')
          .eq('status', 'pending');

        emailsSent++;
      } else {
        // Mark as failed in queue
        await (supabase as any)
          .from('email_queue')
          .update({ 
            status: 'failed',
            error_message: emailResult.error?.toString()
          })
          .eq('user_id', (user as any).id)
          .eq('email_type', 'trial_expiry_warning')
          .eq('status', 'pending');

        errors.push(`Failed to send email to ${(user as any).email}`);
      }
    }

    // Also handle users whose trial has actually expired
    const now = new Date();
    const { data: expiredUsers, error: expiredError } = await supabase
      .from('profiles')
      .select('id, subscription_status, trial_ends_at')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now.toISOString());

    if (!expiredError && expiredUsers && expiredUsers.length > 0) {
      // Update expired trial users to inactive status
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ subscription_status: 'inactive' })
        .in('id', expiredUsers.map(u => (u as any).id));

      if (updateError) {
        errors.push(`Failed to update ${expiredUsers.length} expired trial users`);
      }
    }

    return NextResponse.json({
      message: `Processed ${usersWithExpiringTrials.length} users with expiring trials`,
      emailsSent,
      expiredTrialsUpdated: expiredUsers?.length || 0,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in trial-expiry cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}