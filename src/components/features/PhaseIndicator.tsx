'use client';

import { Users, MessageCircle, Focus, CheckCircle, Clock } from 'lucide-react';

interface PhaseIndicatorProps {
  phase: 'waiting' | 'checkin' | 'focus' | 'checkout' | 'ended';
  duration: number;
}

export function PhaseIndicator({ phase, duration }: PhaseIndicatorProps) {
  const phases = [
    {
      id: 'checkin',
      label: 'Check-in',
      icon: MessageCircle,
      description: '2min - Share your goals',
      color: 'text-primary',
    },
    {
      id: 'focus',
      label: 'Focus',
      icon: Focus,
      description: `${duration - 4}min - Work time`,
      color: 'text-success',
    },
    {
      id: 'checkout',
      label: 'Check-out',
      icon: CheckCircle,
      description: '2min - Share progress',
      color: 'text-warning',
    },
  ];

  const getCurrentPhaseIndex = () => {
    switch (phase) {
      case 'checkin':
        return 0;
      case 'focus':
        return 1;
      case 'checkout':
        return 2;
      case 'ended':
        return 3;
      default:
        return -1;
    }
  };

  const currentIndex = getCurrentPhaseIndex();

  if (phase === 'waiting') {
    return (
      <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg">
        <Clock className="w-5 h-5 text-neutral" />
        <span className="text-sm font-medium">Waiting to start...</span>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-lg">
        <CheckCircle className="w-5 h-5 text-success" />
        <span className="text-sm font-medium text-success">Session Complete!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-black/50 px-3 py-2 rounded-lg">
      {phases.map((phaseItem, index) => {
        const Icon = phaseItem.icon;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <div
            key={phaseItem.id}
            className="flex items-center"
          >
            <div
              className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
                isActive
                  ? `${phaseItem.color} bg-white/10 font-semibold`
                  : isCompleted
                  ? 'text-white/60 font-medium'
                  : 'text-white/40'
              }`}
              title={phaseItem.description}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{phaseItem.label}</span>
            </div>
            
            {index < phases.length - 1 && (
              <div className="mx-1 w-2 h-0.5 bg-white/20 rounded" />
            )}
          </div>
        );
      })}
    </div>
  );
}