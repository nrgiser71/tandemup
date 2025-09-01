'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  plan: 'monthly' | 'yearly';
  onSelect: (plan: 'monthly' | 'yearly') => void;
  isLoading?: boolean;
}

function PricingCard({ 
  title, 
  price, 
  period, 
  features, 
  isPopular = false, 
  plan, 
  onSelect,
  isLoading = false 
}: PricingCardProps) {
  return (
    <div className={`card bg-base-100 shadow-xl ${isPopular ? 'border-2 border-primary' : ''}`}>
      {isPopular && (
        <div className="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </div>
      )}
      
      <div className="card-body text-center">
        <h3 className="card-title justify-center text-2xl">{title}</h3>
        
        <div className="py-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-base-content/60">/{period}</span>
        </div>
        
        <ul className="space-y-3 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg className="w-5 h-5 text-success mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="card-actions justify-center mt-6">
          <button 
            className={`btn ${isPopular ? 'btn-primary' : 'btn-outline'} w-full`}
            onClick={() => onSelect(plan)}
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
            Choose {title}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/signin?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    setSelectedPlan(plan);

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
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // You could show a toast notification here
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setIsLoading(true);

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
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'Unlimited 25 & 50-minute sessions',
    'Instant partner matching',
    'HD video sessions',
    'Session completion tracking',
    'Multi-language support',
    'Mobile-responsive interface',
    'Email notifications & reminders',
    'Community guidelines enforcement'
  ];

  // Show different content based on subscription status
  if (profile?.subscription_status === 'active') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Your Subscription</h1>
          <p className="text-xl text-base-content/80">
            You&apos;re currently subscribed to TandemUp Pro
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <h3 className="card-title justify-center text-2xl text-success">
                ✅ Active Subscription
              </h3>
              
              <p className="py-4">
                You have full access to all TandemUp features.
              </p>
              
              <div className="card-actions justify-center">
                <button 
                  className="btn btn-outline w-full"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading loading-spinner loading-sm"></span>}
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-base-content/80 mb-2">
          Start with a 14-day free trial. No credit card required.
        </p>
        {profile?.subscription_status === 'trial' && profile.trial_ends_at && (
          <p className="text-warning">
            Your trial ends on {new Date(profile.trial_ends_at).toLocaleDateString('nl-NL')}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          title="Monthly"
          price="€9.99"
          period="month"
          features={features}
          plan="monthly"
          onSelect={handleSelectPlan}
          isLoading={isLoading && selectedPlan === 'monthly'}
        />

        <PricingCard
          title="Yearly"
          price="€79.99"
          period="year"
          features={[...features, 'Save 33% compared to monthly']}
          isPopular={true}
          plan="yearly"
          onSelect={handleSelectPlan}
          isLoading={isLoading && selectedPlan === 'yearly'}
        />
      </div>

      <div className="text-center mt-12">
        <div className="bg-base-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">💡 Why TandemUp?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-medium">📹 Camera-On Accountability</h4>
              <p className="text-sm text-base-content/80">
                Work with your camera on to stay focused and accountable
              </p>
            </div>
            <div>
              <h4 className="font-medium">🎯 Structured Sessions</h4>
              <p className="text-sm text-base-content/80">
                25 or 50-minute sessions with built-in breaks and check-ins
              </p>
            </div>
            <div>
              <h4 className="font-medium">🌍 Global Community</h4>
              <p className="text-sm text-base-content/80">
                Match with productivity partners worldwide
              </p>
            </div>
            <div>
              <h4 className="font-medium">📊 Progress Tracking</h4>
              <p className="text-sm text-base-content/80">
                Monitor your focus sessions and build productive habits
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-sm text-base-content/60">
        <p>Cancel anytime. No hidden fees. Full access during your free trial.</p>
      </div>
    </div>
  );
}