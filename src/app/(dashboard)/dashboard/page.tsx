'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ROUTES } from '@/lib/constants';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  TrendingUp,
  CheckCircle 
} from 'lucide-react';

interface UserStats {
  totalSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  uniquePartners: number;
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { subscriptionInfo, getTrialDaysRemaining } = useSubscription();
  
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalFocusMinutes: 0,
    currentStreak: 0,
    uniquePartners: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && profile) {
      loadUserStats();
    }
  }, [user, profile]);

  const loadUserStats = async () => {
    setLoadingStats(true);
    
    try {
      const response = await fetch('/api/auth/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data || {
          totalSessions: 0,
          totalFocusMinutes: 0,
          currentStreak: 0,
          uniquePartners: 0,
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null; // This should be handled by middleware
  }

  const isTrialUser = subscriptionInfo?.status === 'trial';
  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {profile?.first_name}! 👋
            </h1>
            <p className="text-base-content/70 mt-2">
              Ready for your next productive session?
            </p>
          </div>
          
          {isTrialUser && (
            <div className="badge badge-warning gap-2">
              <Clock className="w-4 h-4" />
              Trial Active
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href={ROUTES.BOOK_SESSION} 
            className="card bg-primary text-primary-content hover:scale-105 transition-transform"
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8" />
                <div>
                  <h2 className="card-title">Book New Session</h2>
                  <p className="opacity-90">Find a partner and get focused</p>
                </div>
              </div>
            </div>
          </Link>

          <Link 
            href={ROUTES.MY_SESSIONS}
            className="card bg-base-100 shadow-lg hover:scale-105 transition-transform"
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-secondary" />
                <div>
                  <h2 className="card-title">My Sessions</h2>
                  <p className="text-base-content/70">View upcoming and past sessions</p>
                </div>
              </div>
            </div>
          </Link>

          <Link 
            href={ROUTES.PROFILE}
            className="card bg-base-100 shadow-lg hover:scale-105 transition-transform"
          >
            <div className="card-body">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-accent" />
                <div>
                  <h2 className="card-title">Profile</h2>
                  <p className="text-base-content/70">Manage your account settings</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 shadow-lg rounded-box">
            <div className="stat-figure text-primary">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Sessions Completed</div>
            <div className="stat-value text-primary">
              {loadingStats ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                stats.totalSessions
              )}
            </div>
            <div className="stat-desc">All time</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-box">
            <div className="stat-figure text-secondary">
              <Clock className="w-8 h-8" />
            </div>
            <div className="stat-title">Focus Time</div>
            <div className="stat-value text-secondary">
              {loadingStats ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                `${stats.totalFocusMinutes}m`
              )}
            </div>
            <div className="stat-desc">Total focused minutes</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-box">
            <div className="stat-figure text-accent">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Streak</div>
            <div className="stat-value text-accent">
              {loadingStats ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                stats.currentStreak
              )}
            </div>
            <div className="stat-desc">Days active</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-box">
            <div className="stat-figure text-info">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">Partners</div>
            <div className="stat-value text-info">
              {loadingStats ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                stats.uniquePartners
              )}
            </div>
            <div className="stat-desc">Unique partners</div>
          </div>
        </div>

        {/* Trial Banner */}
        {isTrialUser && (
          <div className="alert alert-info">
            <Users className="w-6 h-6" />
            <div>
              <h3 className="font-bold">You&apos;re on a free trial!</h3>
              <div className="text-sm">
                Enjoy unlimited sessions for the next {' '}
                <span className="font-semibold">{trialDaysRemaining} days</span>. 
                Upgrade anytime to continue your productivity journey.
              </div>
            </div>
            <Link href="/pricing" className="btn btn-sm btn-primary">
              View Plans
            </Link>
          </div>
        )}

        {/* Upcoming Sessions */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Upcoming Sessions</h2>
            
            <div className="text-center py-12 text-base-content/60">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No upcoming sessions</p>
              <p className="mb-4">Book your first session to get started!</p>
              <Link href={ROUTES.BOOK_SESSION} className="btn btn-primary">
                Book Session
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title">Recent Activity</h2>
            
            <div className="text-center py-12 text-base-content/60">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No recent activity</p>
              <p>Your session history will appear here once you complete your first session.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}