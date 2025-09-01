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
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent">
      <div className="flex items-center justify-center gap-4 p-4">
        {/* Emergency End Session */}
        <button
          onClick={onEmergencyEnd}
          className="btn btn-error btn-sm"
          title="Emergency end session"
        >
          <AlertTriangle className="w-4 h-4" />
          Emergency End
        </button>

        {/* Report Issue */}
        <button
          onClick={onReportIssue}
          className="btn btn-warning btn-outline btn-sm"
          title="Report inappropriate behavior"
        >
          <Flag className="w-4 h-4" />
          Report Issue
        </button>

        {/* Leave Session (Normal) */}
        {sessionPhase === 'ended' && (
          <button
            onClick={onLeave}
            className="btn btn-primary btn-sm"
            title="Leave session"
          >
            <Phone className="w-4 h-4" />
            Leave Session
          </button>
        )}

        {/* Help/Instructions */}
        <div className="dropdown dropdown-top dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm"
            title="Session help"
          >
            <HelpCircle className="w-4 h-4" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80 text-base-content"
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
      </div>

      {/* Session Phase Help Text */}
      <div className="text-center pb-4 px-4">
        <div className="text-xs text-white/60 max-w-md mx-auto">
          {sessionPhase === 'checkin' && (
            "💬 Use this time to introduce yourselves and share what you'll focus on"
          )}
          {sessionPhase === 'focus' && (
            "🎯 Work quietly on your tasks. Stay on camera for accountability"
          )}
          {sessionPhase === 'checkout' && (
            "🎉 Share what you accomplished and celebrate your progress!"
          )}
          {sessionPhase === 'ended' && (
            "✅ Great work! Your session is complete. Feel free to leave when ready."
          )}
        </div>
      </div>
    </div>
  );
}