/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { SessionDetails, Profile } from '@/types';
import { JitsiMeetAPI } from '@/types/jitsi';
import { SessionTimer } from './SessionTimer';
import { SessionControls } from './SessionControls';
import { PhaseIndicator } from './PhaseIndicator';
import { CHECKIN_DURATION, CHECKOUT_DURATION } from '@/lib/constants';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  MessageCircle,
  Phone,
  Settings,
  AlertTriangle,
  Users
} from 'lucide-react';

interface VideoSessionProps {
  session: SessionDetails;
  userProfile: Profile;
  onLeave: () => void;
}

export function VideoSession({
  session,
  userProfile,
  onLeave,
}: VideoSessionProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetAPI | null>(null);
  
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<string[]>([userProfile.first_name]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<'waiting' | 'checkin' | 'focus' | 'checkout' | 'ended'>('waiting');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const sessionStart = new Date(session.startTime);
  const sessionDurationMs = session.duration * 60 * 1000;
  const checkinDurationMs = CHECKIN_DURATION * 1000;
  const checkoutDurationMs = CHECKOUT_DURATION * 1000;
  const focusDurationMs = sessionDurationMs - checkinDurationMs - checkoutDurationMs;

  useEffect(() => {
    loadJitsiScript();
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (isJitsiLoaded && jitsiContainerRef.current && !apiRef.current) {
      initializeJitsi();
    }
  }, [isJitsiLoaded]);

  useEffect(() => {
    if (isJoined && !sessionStarted) {
      startSessionTimer();
    }
  }, [isJoined, sessionStarted]);

  const loadJitsiScript = async () => {
    if (window.JitsiMeetExternalAPI) {
      setIsJitsiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || '8x8.vc';
    script.src = `https://${jitsiDomain}/external_api.js`;
    console.log('Loading Jitsi from:', script.src);
    script.async = true;
    script.onload = () => setIsJitsiLoaded(true);
    script.onerror = () => setError('Failed to load video conference. Please refresh and try again.');
    document.head.appendChild(script);
  };

  const initializeJitsi = () => {
    if (!jitsiContainerRef.current || !session.jitsiRoomName) return;

    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || '8x8.vc';
    
    const options = {
      roomName: `${session.jitsiRoomName}_${Date.now()}`, // Unique room to avoid moderator conflicts
      width: '100%',
      height: '100%',
      configOverwrite: {
        disableDeepLinking: true,
        disableProfile: true,
        disableInviteFunctions: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        requireDisplayName: false,
        enableUserRolesBasedOnToken: false,
        enableLobby: false,
        enableLobbyChat: false,
        enableNoisyMicDetection: false,
        enableClosePage: false,
        disableModeratorIndicator: true,
        enableAutomaticUrlCopy: false,
        enableInsecureRoomNameWarning: false,
        enableWelcomePageAdditionalContent: false,
        enableEmailInStats: false,
        p2p: { enabled: false },
        channelLastN: -1,
        startAudioOnly: false,
        startScreenSharing: false,
        openBridgeChannel: true,
        toolbarButtons: [
          'microphone',
          'camera', 
          'closedcaptions',
          'chat',
          'desktop',
          'fullscreen',
          'hangup'
        ],
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Partner',
        TOOLBAR_ALWAYS_VISIBLE: true,
        DISABLE_VIDEO_BACKGROUND: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        DISABLE_PRESENCE_STATUS: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
        HIDE_INVITE_MORE_HEADER: true,
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_RINGING: true,
      },
      userInfo: {
        displayName: userProfile.first_name,
        email: undefined, // Keep private
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;

      // Event listeners
      api.addEventListener('videoConferenceJoined', handleJoined);
      api.addEventListener('videoConferenceLeft', handleLeft);
      api.addEventListener('participantJoined', handleParticipantJoined);
      api.addEventListener('participantLeft', handleParticipantLeft);
      api.addEventListener('audioMuteStatusChanged', handleAudioMuteChanged);
      api.addEventListener('videoMuteStatusChanged', handleVideoMuteChanged);
      api.addEventListener('readyToClose', () => {
        console.log('Jitsi ready to close');
      });

      // Mount to container
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.appendChild((api as any).getIFrame());
      }
    } catch (err) {
      setError('Failed to initialize video conference');
      console.error('Jitsi initialization error:', err);
    }
  };

  const handleJoined = (data: { displayName?: string; [key: string]: unknown }) => {
    console.log('Joined conference:', data);
    setIsJoined(true);
  };

  const handleLeft = () => {
    setIsJoined(false);
    onLeave();
  };

  const handleParticipantJoined = (data: { displayName?: string; [key: string]: unknown }) => {
    console.log('Participant joined:', data);
    setParticipants(prev => [...prev, data.displayName || 'Partner']);
  };

  const handleParticipantLeft = (data: { displayName?: string; [key: string]: unknown }) => {
    console.log('Participant left:', data);
    setParticipants(prev => prev.filter(p => p !== (data.displayName || 'Partner')));
  };

  const handleAudioMuteChanged = (data: { muted: boolean }) => {
    setIsMuted(data.muted);
  };

  const handleVideoMuteChanged = (data: { muted: boolean }) => {
    setIsVideoMuted(data.muted);
  };

  const startSessionTimer = () => {
    setSessionStarted(true);
    setSessionPhase('checkin');

    // Phase transitions
    setTimeout(() => {
      setSessionPhase('focus');
      if (apiRef.current) {
        apiRef.current.executeCommand('toggleAudio'); // Mute for focus time
      }
    }, checkinDurationMs);

    setTimeout(() => {
      setSessionPhase('checkout');
      if (apiRef.current && isMuted) {
        apiRef.current.executeCommand('toggleAudio'); // Unmute for checkout
      }
    }, checkinDurationMs + focusDurationMs);

    setTimeout(() => {
      setSessionPhase('ended');
      // Auto-leave after 2 minutes of checkout
      setTimeout(() => {
        if (apiRef.current) {
          apiRef.current.executeCommand('hangup');
        }
      }, checkoutDurationMs);
    }, sessionDurationMs);
  };

  const handleEmergencyEnd = () => {
    if (confirm('Are you sure you want to end the session early? This will be reported.')) {
      if (apiRef.current) {
        apiRef.current.executeCommand('hangup');
      }
    }
  };

  const handleReportIssue = () => {
    setShowReportModal(true);
  };

  const getPhaseMessage = () => {
    switch (sessionPhase) {
      case 'waiting':
        return 'Waiting for session to begin...';
      case 'checkin':
        return 'Check-in time: Share what you\'ll work on today';
      case 'focus':
        return 'Focus time: Work quietly with cameras on';
      case 'checkout':
        return 'Check-out time: Share what you accomplished';
      case 'ended':
        return 'Session completed!';
      default:
        return '';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="btn btn-primary"
          >
            Return to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header - Enhanced */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center justify-between p-4">
          {/* TandemUp Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-semibold text-lg">TandemUp</span>
          </div>
          
          {/* Session Info */}
          <div className="flex items-center gap-4">
            {sessionStarted && (
              <SessionTimer
                phase={sessionPhase}
                sessionStart={sessionStart}
                duration={session.duration}
              />
            )}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-full backdrop-blur-sm">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-medium">{participants.length}</span>
            </div>
          </div>
        </div>
        
        {/* Phase Indicator - More Prominent */}
        <div className="px-4 pb-6">
          <div className="flex flex-col items-center gap-3">
            <PhaseIndicator 
              phase={sessionPhase}
              duration={session.duration}
            />
            <p className="text-center text-sm text-white/90 font-medium">
              {getPhaseMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Jitsi Container */}
      <div 
        ref={jitsiContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          width: '100%', 
          height: '100vh',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }}
      />

      {/* Loading State - Non-blocking corner indicator */}
      {!isJoined && isJitsiLoaded && (
        <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-md rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-2">
            <div className="loading loading-spinner loading-sm"></div>
            <span className="text-sm">Waiting to join...</span>
          </div>
        </div>
      )}
      
      {/* Jitsi Loading State */}
      {!isJitsiLoaded && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="loading loading-spinner loading-lg text-primary mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Loading Video Conference</h2>
            <p className="text-white/80">Preparing your TandemUp session...</p>
          </div>
        </div>
      )}

      {/* Session Controls */}
      <SessionControls
        isJoined={isJoined}
        isMuted={isMuted}
        isVideoMuted={isVideoMuted}
        sessionPhase={sessionPhase}
        onEmergencyEnd={handleEmergencyEnd}
        onReportIssue={handleReportIssue}
        onLeave={() => {
          if (apiRef.current) {
            apiRef.current.executeCommand('hangup');
          }
        }}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-base-content">Report Issue</h3>
            <p className="py-4 text-base-content">
              This will immediately end the session and report inappropriate behavior.
              Are you sure you want to continue?
            </p>
            <div className="modal-action">
              <button
                onClick={() => setShowReportModal(false)}
                className="btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Submit report
                  if (apiRef.current) {
                    apiRef.current.executeCommand('hangup');
                  }
                  setShowReportModal(false);
                }}
                className="btn btn-error"
              >
                Report & End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}