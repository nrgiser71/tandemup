/* eslint-disable @typescript-eslint/no-explicit-any */import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { constructWebhookEvent } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    const payload = await request.text();
    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error('No userId in checkout session metadata');
          break;
        }

        // Update user profile with subscription info
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating profile after checkout:', error);
        } else {
          console.log(`Subscription activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = (subscription as any).customer as string;

        // Find user by customer ID
        const { data: profile, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (findError || !profile) {
          console.error('Profile not found for customer:', customerId);
          break;
        }

        // Update subscription status
        let status = 'inactive';
        if ((subscription as any).status === 'active' || (subscription as any).status === 'trialing') {
          status = 'active';
        } else if ((subscription as any).status === 'past_due') {
          status = 'past_due';
        }

        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_id: (subscription as any).id,
            subscription_ends_at: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', (profile as any).id);

        if (error) {
          console.error('Error updating subscription:', error);
        } else {
          console.log(`Subscription ${event.type} for user ${(profile as any).id}: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = (subscription as any).customer as string;

        // Find user by customer ID
        const { data: profile, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (findError || !profile) {
          console.error('Profile not found for customer:', customerId);
          break;
        }

        // Update to inactive
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            subscription_id: null,
            subscription_ends_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', (profile as any).id);

        if (error) {
          console.error('Error canceling subscription:', error);
        } else {
          console.log(`Subscription canceled for user ${(profile as any).id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: profile, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (findError || !profile) {
          console.error('Profile not found for customer:', customerId);
          break;
        }

        // Update subscription status to active on successful payment
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', (profile as any).id);

        if (error) {
          console.error('Error updating profile after payment:', error);
        } else {
          console.log(`Payment succeeded for user ${(profile as any).id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: profile, error: findError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (findError || !profile) {
          console.error('Profile not found for customer:', customerId);
          break;
        }

        // Update subscription status to past_due
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('id', (profile as any).id);

        if (error) {
          console.error('Error updating profile after failed payment:', error);
        } else {
          console.log(`Payment failed for user ${(profile as any).id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}