'use client';

import { AlertTriangle, Phone, Flag, HelpCircle } from 'lucide-react';

interface SessionControlsProps {
  isJoined: boolean;
  isMuted: boolean;
  isVideoMuted: boolean;
  sessionPhase: 'waiting' | 'checkin' | 'focus' | 'checkout' | 'ended';
  onEmergencyEnd: () => void;
  onReportIssue: () => void;
  onLeave: () => void;
}

export function SessionControls({
  isJoined,
  isMuted,
  isVideoMuted,
  sessionPhase,
  onEmergencyEnd,
  onReportIssue,
  onLeave,
}: SessionControlsProps) {
  if (!isJoined) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Session Phase Help Text - Above controls */}
      <div className="text-center pb-4 px-4">
        <div className="inline-block bg-black/80 backdrop-blur-md rounded-full px-4 py-2 text-sm text-white/90 border border-white/10">
          {sessionPhase === 'checkin' && (
            <span className="flex items-center gap-2">
              <span>💬</span>
              Use this time to introduce yourselves and share what you&apos;ll focus on
            </span>
          )}
          {sessionPhase === 'focus' && (
            <span className="flex items-center gap-2">
              <span>🎯</span>
              Work quietly on your tasks. Stay on camera for accountability
            </span>
          )}
          {sessionPhase === 'checkout' && (
            <span className="flex items-center gap-2">
              <span>🎉</span>
              Share what you accomplished and celebrate your progress!
            </span>
          )}
          {sessionPhase === 'ended' && (
            <span className="flex items-center gap-2">
              <span>✅</span>
              Great work! Your session is complete. Feel free to leave when ready.
            </span>
          )}
        </div>
      </div>
      
      {/* Controls Bar */}
      <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-3 p-4">
          {/* Help/Instructions - More accessible */}
          <div className="dropdown dropdown-top dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm bg-white/10 hover:bg-white/20 border border-white/20"
              title="Session help"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Help</span>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 rounded-2xl w-80 text-base-content border border-gray-200"
            >
              <li className="menu-title">
                <span>Session Guidelines</span>
              </li>
              <li>
                <div className="text-xs">
                  <strong>Check-in (2 min):</strong> Share what you plan to work on with your partner
                </div>
              </li>
              <li>
                <div className="text-xs">
                  <strong>Focus Time ({sessionPhase === 'focus' ? 'Current' : 'Next'}):</strong> Work quietly with cameras on, audio muted
                </div>
              </li>
              <li>
                <div className="text-xs">
                  <strong>Check-out (2 min):</strong> Share what you accomplished and celebrate progress
                </div>
              </li>
              <li className="menu-title">
                <span>Controls</span>
              </li>
              <li>
                <div className="text-xs">
                  Use the Jitsi toolbar below to control your audio, video, and chat
                </div>
              </li>
              <li>
                <div className="text-xs">
                  Camera must stay on during the entire session for accountability
                </div>
              </li>
            </ul>
          </div>

          {/* Report Issue - More prominent */}
          <button
            onClick={onReportIssue}
            className="btn btn-warning btn-sm bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning"
            title="Report inappropriate behavior"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Emergency End Session - More visible */}
          <button
            onClick={onEmergencyEnd}
            className="btn btn-error btn-sm bg-error/20 hover:bg-error/30 border border-error/40 text-error"
            title="Emergency end session"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency End</span>
          </button>

          {/* Leave Session (Normal) - More prominent when available */}
          {sessionPhase === 'ended' && (
            <button
              onClick={onLeave}
              className="btn btn-primary btn-sm bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary animate-pulse"
              title="Leave session"
            >
              <Phone className="w-4 h-4" />
              Leave Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}