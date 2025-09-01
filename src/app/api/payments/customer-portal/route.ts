/* eslint-disable @typescript-eslint/no-explicit-any */import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCustomerPortalSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!(profile as any).stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No active subscription found' 
      }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard`;

    const { session, error } = await createCustomerPortalSession(
      (profile as any).stripe_customer_id,
      returnUrl
    );

    if (error || !session) {
      console.error('Error creating customer portal session:', error);
      return NextResponse.json(
        { error: 'Failed to create customer portal session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Error in customer-portal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}