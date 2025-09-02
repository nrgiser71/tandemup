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
    <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10">
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                isActive
                  ? `${phaseItem.color} bg-white/15 font-semibold shadow-lg ring-1 ring-white/20`
                  : isCompleted
                  ? 'text-white/70 font-medium bg-white/5'
                  : 'text-white/50 bg-transparent hover:bg-white/5'
              }`}
              title={phaseItem.description}
            >
              <Icon className={`w-5 h-5 ${
                isActive ? 'animate-pulse' : ''
              }`} />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{phaseItem.label}</span>
                {isActive && (
                  <span className="text-xs opacity-80">
                    {phaseItem.description.split(' - ')[1]}
                  </span>
                )}
              </div>
            </div>
            
            {index < phases.length - 1 && (
              <div className={`mx-2 w-4 h-0.5 rounded transition-all duration-300 ${
                isCompleted ? 'bg-white/40' : 'bg-white/20'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}