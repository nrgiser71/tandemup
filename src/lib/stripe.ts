import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Price IDs - these should match your Stripe dashboard
export const PRICE_IDS = {
  MONTHLY: process.env.STRIPE_MONTHLY_PRICE_ID || '',
  YEARLY: process.env.STRIPE_YEARLY_PRICE_ID || '',
};

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams) {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return { session, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { session: null, error };
  }
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { session, error: null };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return { session: null, error };
  }
}

export async function getSubscriptionStatus(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { status: 'inactive', subscription: null };
    }

    const subscription = subscriptions.data[0];
    return { 
      status: subscription.status,
      subscription: {
        id: subscription.id,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
        items: subscription.items.data.map(item => ({
          price_id: item.price.id,
          product_id: item.price.product as string,
        })),
      }
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { status: 'error', subscription: null };
  }
}

export function isValidWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    console.error('Invalid webhook signature:', error);
    return false;
  }
}

export function constructWebhookEvent(
  payload: string,
  signature: string,
  secret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    throw error;
  }
}