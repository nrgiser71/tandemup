'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ROUTES } from '@/lib/constants';
import { 
  Users, 
  Clock, 
  Video, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
          <p className="text-lg text-base-content/70 mb-8">
            Ready for your next focused work session?
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={ROUTES.BOOK_SESSION} className="btn btn-primary">
              Book a Session
            </Link>
            <Link href={ROUTES.DASHBOARD} className="btn btn-outline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="hero min-h-[80vh] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6">
              Work Better <span className="text-primary">Together</span>
            </h1>
            <p className="text-xl mb-8 text-base-content/70">
              Join focused work sessions with accountability partners via video calls.
              Stay productive, stay motivated, stay on track.
            </p>
            <div className="flex gap-4 justify-center mb-12">
              <Link href={ROUTES.SIGN_UP} className="btn btn-primary btn-lg">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href={ROUTES.SIGN_IN} className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </div>
            
            {/* Stats */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Active Users</div>
                <div className="stat-value">1,200+</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-secondary">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="stat-title">Sessions Completed</div>
                <div className="stat-value">15K+</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-accent">
                  <Star className="w-8 h-8" />
                </div>
                <div className="stat-title">Avg Rating</div>
                <div className="stat-value">4.8/5</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-base-content/70">
            Simple, effective, and designed for maximum productivity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="card-title justify-center">Book & Match</h3>
              <p>
                Choose your session length (25 or 50 minutes) and get matched 
                with a partner who shares your focus time.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <Video className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="card-title justify-center">Work Together</h3>
              <p>
                Join a video session with check-in, focused work time, 
                and check-out phases for maximum accountability.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="card-title justify-center">Stay Focused</h3>
              <p>
                Camera-on sessions ensure accountability while you work 
                on your most important tasks together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-base-200 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose TandemUp?</h2>
          <p className="text-lg text-base-content/70">
            Everything you need for productive virtual coworking
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Instant Matching</h3>
                <p className="text-base-content/70">
                  Get matched with compatible partners in seconds, or create your own session.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Structured Sessions</h3>
                <p className="text-base-content/70">
                  Proven Pomodoro-style sessions with check-in and check-out phases.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Safe & Secure</h3>
                <p className="text-base-content/70">
                  Community guidelines and reporting system ensure a professional environment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">No Commitment</h3>
                <p className="text-base-content/70">
                  Start with a 14-day free trial, cancel anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-primary text-primary-content">
            <div className="card-body text-center">
              <h3 className="card-title text-2xl justify-center mb-4">
                Ready to boost your productivity?
              </h3>
              <p className="mb-6">
                Join thousands of professionals who use TandemUp to stay focused and get more done.
              </p>
              <div className="card-actions justify-center">
                <Link href={ROUTES.SIGN_UP} className="btn btn-secondary">
                  Start Free Trial
                </Link>
              </div>
              <div className="text-sm opacity-70 mt-4">
                No credit card required • 14-day free trial
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-lg text-base-content/70">
            Start free, upgrade when you're ready
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-2xl">Free Trial</h3>
                <div className="text-4xl font-bold text-primary mb-4">
                  €0<span className="text-lg font-normal">/14 days</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    Unlimited sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    All features included
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    No credit card required
                  </li>
                </ul>
                <Link href={ROUTES.SIGN_UP} className="btn btn-outline">
                  Start Free Trial
                </Link>
              </div>
            </div>

            <div className="card bg-primary text-primary-content shadow-lg">
              <div className="card-body">
                <h3 className="card-title text-2xl">Pro</h3>
                <div className="text-4xl font-bold mb-4">
                  €9.99<span className="text-lg font-normal">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Unlimited sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Priority matching
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Cancel anytime
                  </li>
                </ul>
                <Link href={ROUTES.SIGN_UP} className="btn btn-secondary">
                  Start with Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
