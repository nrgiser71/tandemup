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
    switch (phase) {
      case 'checkin':
        return {
          bg: 'bg-primary/20',
          text: 'text-primary',
          gradient: 'from-primary/80 to-primary'
        };
      case 'focus':
        return {
          bg: 'bg-success/20',
          text: 'text-success',
          gradient: 'from-success/80 to-success'
        };
      case 'checkout':
        return {
          bg: 'bg-warning/20',
          text: 'text-warning',
          gradient: 'from-warning/80 to-warning'
        };
      case 'ended':
        return {
          bg: 'bg-success/20',
          text: 'text-success',
          gradient: 'from-success/80 to-success'
        };
      default:
        return {
          bg: 'bg-neutral/20',
          text: 'text-neutral',
          gradient: 'from-neutral/80 to-neutral'
        };
    }
  };

  const progress = totalPhaseTime > 0 ? ((totalPhaseTime - timeRemaining) / totalPhaseTime) * 100 : 0;

  if (phase === 'waiting') {
    return null;
  }

  const colors = getProgressColor();
  
  return (
    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 fade-in-up">
      <div className={`p-2 rounded-lg ${colors.bg}`}>
        <Clock className={`w-5 h-5 ${colors.text}`} />
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="text-xl font-mono font-bold text-white tracking-wider">
          {formatTime(timeRemaining)}
        </div>
        
        <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden relative">
          <div 
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000 rounded-full relative`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
          
          {/* Progress indicator dot */}
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full transition-all duration-1000`}
            style={{ left: `${Math.max(0, Math.min(100, progress))}%`, transform: 'translateX(-50%) translateY(-50%)' }}
          />
        </div>
        
        <div className="text-xs text-white/70 font-medium capitalize">
          {phase} phase
        </div>
      </div>
    </div>
  );
}