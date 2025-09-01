'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionInfo {
  status: 'trial' | 'active' | 'inactive' | 'past_due' | 'cancelled';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  isActive: boolean;
  canBookSessions: boolean;
}

export function useSubscription() {
  const { profile } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    const now = new Date();
    let canBookSessions = false;
    let isActive = false;

    switch (profile.subscription_status) {
      case 'trial':
        // Check if trial is still valid
        if (profile.trial_ends_at && new Date(profile.trial_ends_at) > now) {
          canBookSessions = true;
          isActive = true;
        }
        break;
      case 'active':
        canBookSessions = true;
        isActive = true;
        break;
      case 'inactive':
      case 'past_due':
      case 'cancelled':
      default:
        canBookSessions = false;
        isActive = false;
        break;
    }

    setSubscriptionInfo({
      status: profile.subscription_status || 'trial',
      trialEndsAt: profile.trial_ends_at,
      subscriptionEndsAt: profile.subscription_ends_at,
      isActive,
      canBookSessions,
    });

    setIsLoading(false);
  }, [profile]);

  const createCheckoutSession = async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const response = await fetch('/api/payments/customer-portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  };

  const getTrialDaysRemaining = () => {
    if (!subscriptionInfo?.trialEndsAt || subscriptionInfo.status !== 'trial') {
      return 0;
    }

    const now = new Date();
    const trialEnd = new Date(subscriptionInfo.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  return {
    subscriptionInfo,
    isLoading,
    createCheckoutSession,
    openCustomerPortal,
    getTrialDaysRemaining,
  };
}