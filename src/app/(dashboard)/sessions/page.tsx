'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { SessionDetails } from '@/types';
import { ROUTES } from '@/lib/constants';
import { formatDateTime, getTimeUntil } from '@/lib/utils';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  X,
  User,
  AlertTriangle,
  CheckCircle,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function MySessionsPage() {
  const { user, profile, loading } = useAuth();
  
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDetails[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionDetails[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to auth');
      window.location.href = '/auth';
      return;
    }
  }, [loading, user]);

  useEffect(() => {
    if (user && profile) {
      loadSessions();
    }
  }, [user, profile]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    
    try {
      const response = await fetch('/api/sessions/my-sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const result = await response.json();
      
      if (result.data) {
        const upcoming = result.data.upcoming || [];
        const past = result.data.past || [];
        
        setUpcomingSessions(upcoming);
        setPastSessions(past);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Keep empty arrays on error - user will see empty state
      setUpcomingSessions([]);
      setPastSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/sessions/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to cancel session');
      }
      
      // Remove from upcoming sessions
      setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error cancelling session:', error);
      // Show error to user - you might want to add a toast notification here
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <div className="badge badge-success">Matched</div>;
      case 'waiting':
        return <div className="badge badge-warning">Waiting</div>;
      case 'completed':
        return <div className="badge badge-success">Completed</div>;
      case 'cancelled':
        return <div className="badge badge-error">Cancelled</div>;
      case 'no_show':
        return <div className="badge badge-error">No Show</div>;
      default:
        return <div className="badge badge-neutral">{status}</div>;
    }
  };

  const canJoinSession = (session: SessionDetails) => {
    if (session.status !== 'matched') return false;
    
    const timeUntil = getTimeUntil(session.startTime);
    return timeUntil && timeUntil.totalMinutes <= 5; // Can join 5 minutes before
  };

  if (loading || loadingSessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Show login message if no user (while redirect is happening)
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="card-title justify-center mb-2">Login Required</h2>
            <p className="text-base-content/70 mb-4">
              You need to log in to view your sessions.
            </p>
            <div className="card-actions justify-center">
              <a href="/auth" className="btn btn-primary">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Sessions</h1>
            <p className="text-base-content/70 mt-2">
              Manage your upcoming sessions and view your session history
            </p>
          </div>
          
          <Link href={ROUTES.BOOK_SESSION} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Book Session
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed w-fit">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`tab ${activeTab === 'upcoming' ? 'tab-active' : ''}`}
          >
            Upcoming ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`tab ${activeTab === 'past' ? 'tab-active' : ''}`}
          >
            Past ({pastSessions.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-base-content/60 mb-6">
                    Book your next session to stay productive and focused
                  </p>
                  <Link href={ROUTES.BOOK_SESSION} className="btn btn-primary">
                    Book Your First Session
                  </Link>
                </div>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Session Info */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="font-medium">
                              {formatDateTime(session.startTime)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span>{session.duration} minutes</span>
                          </div>
                          
                          {getStatusBadge(session.status)}
                        </div>

                        {/* Partner Info */}
                        {session.partner ? (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" />
                            <span>Partner: {session.partner.firstName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-warning">
                            <User className="w-4 h-4" />
                            <span>Waiting for partner...</span>
                          </div>
                        )}

                        {/* Time Until Session */}
                        {(() => {
                          const timeUntil = getTimeUntil(session.startTime);
                          if (!timeUntil) return null;
                          
                          return (
                            <div className="text-sm text-base-content/60">
                              {timeUntil.totalMinutes < 60
                                ? `Starts in ${timeUntil.totalMinutes} minutes`
                                : `Starts in ${timeUntil.hours}h ${timeUntil.minutes}m`
                              }
                            </div>
                          );
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {canJoinSession(session) && (
                          <Link
                            href={`${ROUTES.SESSION_ROOM}/${session.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </Link>
                        )}
                        
                        {session.canCancel && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this session?')) {
                                handleCancelSession(session.id);
                              }
                            }}
                            className="btn btn-error btn-outline btn-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="space-y-4">
            {pastSessions.length === 0 ? (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Session History</h3>
                  <p className="text-base-content/60 mb-6">
                    Complete your first session to see your history here
                  </p>
                  <Link href={ROUTES.BOOK_SESSION} className="btn btn-primary">
                    Book Your First Session
                  </Link>
                </div>
              </div>
            ) : (
              pastSessions.map((session) => (
                <div key={session.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Session Info */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="font-medium">
                              {formatDateTime(session.startTime)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span>{session.duration} minutes</span>
                          </div>
                          
                          {getStatusBadge(session.status)}
                        </div>

                        {/* Partner Info */}
                        {session.partner && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" />
                            <span>Partner: {session.partner.firstName}</span>
                          </div>
                        )}

                        {/* No Show Warning */}
                        {session.status === 'no_show' && (
                          <div className="flex items-center gap-2 text-error">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">
                              Your partner didn&apos;t show up. This doesn&apos;t count against you.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}