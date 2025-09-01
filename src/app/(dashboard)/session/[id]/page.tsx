'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VideoSession } from '@/components/features/VideoSession';
import { SessionDetails } from '@/types';
import { ROUTES } from '@/lib/constants';
import { formatTime } from '@/lib/utils';
import { 
  Video, 
  Clock, 
  Users,
  Monitor,
  Smartphone,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user && sessionId) {
      loadSession();
    }
  }, [user, sessionId]);

  const loadSession = async () => {
    setLoadingSession(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Session not found');
      }

      const data = await response.json();
      
      // For now, use mock data
      const mockSession: SessionDetails = {
        id: sessionId,
        startTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        duration: 25,
        status: 'matched',
        partner: {
          id: 'partner1',
          firstName: 'Alice',
          avatarUrl: undefined,
        },
        jitsiRoomName: `tandemup_${sessionId}`,
        canCancel: false,
        canJoin: true,
      };

      setSession(mockSession);
    } catch (err) {
      setError('Failed to load session. Please check if the session exists and you have permission to access it.');
      console.error('Error loading session:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  if (loading || loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="card-title justify-center text-error">Session Not Available</h2>
            <p className="text-base-content/70 mb-6">
              {error || 'This session could not be found or is no longer available.'}
            </p>
            <div className="card-actions justify-center">
              <button
                onClick={() => router.push(ROUTES.MY_SESSIONS)}
                className="btn btn-primary"
              >
                My Sessions
              </button>
              <button
                onClick={() => router.push(ROUTES.BOOK_SESSION)}
                className="btn btn-outline"
              >
                Book New Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Mobile device restriction
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <Monitor className="w-16 h-16 text-warning mx-auto mb-4" />
            <h2 className="card-title justify-center">Desktop Required</h2>
            <p className="text-base-content/70 mb-4">
              Video sessions work best on desktop devices for optimal camera positioning and focus.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-base-content/60 mb-6">
              <Smartphone className="w-4 h-4" />
              <span>Mobile detected</span>
            </div>
            <div className="text-sm text-base-content/60">
              Please access TandemUp from a desktop computer to join your session.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sessionTime = new Date(session.startTime);
  const now = new Date();
  const timeUntilSession = sessionTime.getTime() - now.getTime();

  // Session hasn't started yet (more than 5 minutes early)
  if (timeUntilSession > 5 * 60 * 1000) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="card-title justify-center">Session Starts Soon</h2>
            <p className="text-base-content/70 mb-6">
              Your session with {session.partner?.firstName} starts at{' '}
              <span className="font-semibold">{formatTime(session.startTime)}</span>
            </p>
            
            <div className="bg-base-200 p-4 rounded-lg mb-6">
              <div className="text-sm text-base-content/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{session.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Partner:</span>
                  <span className="font-medium">{session.partner?.firstName}</span>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-base-content/60 mb-6">
              You can join up to 5 minutes before the scheduled start time.
            </div>
            
            <button
              onClick={() => router.push(ROUTES.MY_SESSIONS)}
              className="btn btn-outline"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session is too far in the past
  if (timeUntilSession < -30 * 60 * 1000) { // More than 30 minutes past
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <Clock className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
            <h2 className="card-title justify-center">Session Ended</h2>
            <p className="text-base-content/70 mb-6">
              This session has already ended. Sessions automatically close 30 minutes after the scheduled end time.
            </p>
            <button
              onClick={() => router.push(ROUTES.MY_SESSIONS)}
              className="btn btn-primary"
            >
              View All Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ready to join session
  return (
    <div className="min-h-screen bg-black">
      <VideoSession
        session={session}
        userProfile={profile}
        onLeave={() => router.push(ROUTES.MY_SESSIONS)}
      />
    </div>
  );
}