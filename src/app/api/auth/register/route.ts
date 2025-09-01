import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, generateWelcomeEmail } from '@/lib/mailgun';

interface RegisterRequest {
  firstName: string;
  email: string;
  password: string;
  language: 'en' | 'nl' | 'fr';
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, email, password, language }: RegisterRequest = await request.json();

    // Validate input
    if (!firstName || !email || !password || !language) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!['en', 'nl', 'fr'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          language: language
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile (this should be handled by the database trigger, but let's be explicit)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName,
        email: email,
        language: language,
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        timezone: 'Europe/Amsterdam', // Default timezone
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't return error here as auth user was created successfully
    }

    // Send welcome email
    try {
      const { subject, html } = generateWelcomeEmail(firstName);
      
      // Add to email queue
      await supabase
        .from('email_queue')
        .insert({
          user_id: authData.user.id,
          email_type: 'welcome',
          to_email: email,
          subject,
          html_content: html,
          status: 'pending'
        });

      // Send the email
      const emailResult = await sendEmail({
        to: email,
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
          .eq('user_id', authData.user.id)
          .eq('email_type', 'welcome')
          .eq('status', 'pending');
      } else {
        // Mark as failed in queue
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            error_message: emailResult.error?.toString()
          })
          .eq('user_id', authData.user.id)
          .eq('email_type', 'welcome')
          .eq('status', 'pending');
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: firstName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}