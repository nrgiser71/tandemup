'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { CHECKIN_DURATION, CHECKOUT_DURATION } from '@/lib/constants';

interface SessionTimerProps {
  phase: 'waiting' | 'checkin' | 'focus' | 'checkout' | 'ended';
  sessionStart: Date;
  duration: number; // in minutes
}

export function SessionTimer({ phase, sessionStart, duration }: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalPhaseTime, setTotalPhaseTime] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStart.getTime();
      const totalSessionMs = duration * 60 * 1000;
      const checkinMs = CHECKIN_DURATION * 1000;
      const checkoutMs = CHECKOUT_DURATION * 1000;
      const focusMs = totalSessionMs - checkinMs - checkoutMs;

      let remaining = 0;
      let phaseTotal = 0;

      switch (phase) {
        case 'checkin':
          remaining = Math.max(0, checkinMs - elapsedMs);
          phaseTotal = checkinMs;
          break;
        case 'focus':
          const focusElapsed = elapsedMs - checkinMs;
          remaining = Math.max(0, focusMs - focusElapsed);
          phaseTotal = focusMs;
          break;
        case 'checkout':
          const checkoutElapsed = elapsedMs - checkinMs - focusMs;
          remaining = Math.max(0, checkoutMs - checkoutElapsed);
          phaseTotal = checkoutMs;
          break;
        case 'ended':
          remaining = 0;
          phaseTotal = totalSessionMs;
          break;
        default:
          remaining = totalSessionMs;
          phaseTotal = totalSessionMs;
      }

      setTimeRemaining(remaining);
      setTotalPhaseTime(phaseTotal);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [phase, sessionStart, duration]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const progress = (totalPhaseTime - timeRemaining) / totalPhaseTime;
    
    switch (phase) {
      case 'checkin':
        return 'primary';
      case 'focus':
        return 'success';
      case 'checkout':
        return 'warning';
      case 'ended':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const progress = totalPhaseTime > 0 ? ((totalPhaseTime - timeRemaining) / totalPhaseTime) * 100 : 0;

  if (phase === 'waiting') {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
      <Clock className="w-5 h-5" />
      
      <div className="flex flex-col gap-1">
        <div className="text-lg font-mono font-bold">
          {formatTime(timeRemaining)}
        </div>
        
        <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${getProgressColor()} transition-all duration-1000`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}