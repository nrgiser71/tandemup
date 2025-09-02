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
        startTime: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago (can join now)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Session</h2>
          <p className="text-gray-600 mb-4">Preparing your TandemUp experience...</p>
          <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent animate-pulse rounded-full" style={{width: '60%'}}></div>
          </div>
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

  // Mobile device restriction - Enhanced UI
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="card bg-white shadow-2xl max-w-md border border-gray-100">
          <div className="card-body text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-warning/20 to-warning/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-10 h-10 text-warning" />
              </div>
              <h2 className="card-title justify-center text-2xl font-bold text-gray-800 mb-2">
                Desktop Required
              </h2>
              <p className="text-gray-600 mb-4">
                TandemUp video sessions require a desktop or laptop computer for the best experience.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-orange-700 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="font-medium">Mobile device detected</span>
              </div>
              <p className="text-xs text-orange-600">
                Camera positioning and focus accountability work best on larger screens
              </p>
            </div>
            
            <div className="text-sm text-gray-500 space-y-2">
              <p>Please access TandemUp from:</p>
              <ul className="text-left space-y-1 max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Desktop computer
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Laptop with webcam
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Chrome or Firefox browser
                </li>
              </ul>
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