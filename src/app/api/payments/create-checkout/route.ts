/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const priceId = plan === 'monthly' ? PRICE_IDS.MONTHLY : PRICE_IDS.YEARLY;
    
    if (!priceId) {
      return NextResponse.json({ 
        error: 'Price ID not configured for this plan' 
      }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/pricing?payment=cancelled`;

    const { session, error } = await createCheckoutSession({
      userId: user.id,
      email: (profile as any).email,
      priceId,
      successUrl,
      cancelUrl,
    });

    if (error || !session) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error in create-checkout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}