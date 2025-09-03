'use client';

import { TimeSlot } from '@/types';
import { 
  Clock, 
  Users, 
  Plus, 
  Lock,
  UserCheck,
  Zap,
  ChevronRight
} from 'lucide-react';

interface SessionCardProps {
  slot: TimeSlot;
  onClick: (slot: TimeSlot) => void;
}

export function SessionCard({ slot, onClick }: SessionCardProps) {
  const handleClick = () => {
    if (slot.available) {
      onClick(slot);
    }
  };

  const getCardClassName = () => {
    const baseClasses = `
      group relative min-h-[140px] p-5 rounded-2xl transition-all duration-300 cursor-pointer
      overflow-hidden
    `;

    if (!slot.available || slot.status === 'unavailable') {
      return `${baseClasses}
        bg-white border border-gray-100 cursor-not-allowed shadow-sm
        hover:shadow-sm opacity-70
      `;
    }

    if (slot.status === 'waiting') {
      return `${baseClasses}
        bg-gradient-to-br from-emerald-400 to-emerald-500 border border-emerald-300/50
        text-white shadow-md shadow-emerald-500/20
        hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] hover:-translate-y-0.5
        animate-pulse hover:animate-none
      `;
    }

    if (slot.status === 'matched') {
      return `${baseClasses}
        bg-gradient-to-br from-blue-400 to-blue-500 border border-blue-300/50
        text-white shadow-md shadow-blue-500/20
        hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] hover:-translate-y-0.5
      `;
    }

    // Default available - Apple white style
    return `${baseClasses}
      bg-white border border-gray-200 shadow-sm
      hover:shadow-md hover:border-blue-300 hover:scale-[1.02] hover:-translate-y-0.5
      hover:bg-blue-50/30
    `;
  };

  const getMainIcon = () => {
    const iconClasses = "w-8 h-8 mb-2";
    
    if (slot.status === 'waiting') {
      return (
        <div className="relative">
          <div className="p-2 bg-white/25 rounded-full backdrop-blur-sm">
            <Users className={`${iconClasses} text-white`} />
          </div>
          <div className="absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm">
            1
          </div>
        </div>
      );
    }

    if (slot.status === 'matched') {
      return (
        <div className="p-2 bg-white/25 rounded-full backdrop-blur-sm">
          <UserCheck className={`${iconClasses} text-white`} />
        </div>
      );
    }

    if (!slot.available || slot.status === 'unavailable') {
      return (
        <div className="p-3 bg-gray-50 rounded-full border border-gray-100">
          <Lock className={`${iconClasses} text-gray-400`} />
        </div>
      );
    }

    // Available - Apple blue style
    return (
      <div className="p-3 bg-blue-50 rounded-full border border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200 transition-all">
        <Plus className={`${iconClasses} text-blue-600 group-hover:text-blue-700`} />
      </div>
    );
  };

  const getTimeDisplay = () => {
    const timeClasses = slot.status === 'waiting' || slot.status === 'matched' 
      ? "text-2xl font-bold text-white" 
      : "text-2xl font-bold text-gray-900";
    
    return <div className={timeClasses}>{slot.time}</div>;
  };

  const getStatusContent = () => {
    if (slot.status === 'waiting' && slot.waitingUser) {
      return (
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-white/90 font-medium">
              {slot.waitingUser.firstName}
            </div>
            <div className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
              {slot.waitingUser.duration}min
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Ready to start</span>
          </div>
        </div>
      );
    }

    if (slot.status === 'matched') {
      return (
        <div className="flex-1 space-y-2">
          <div className="text-white/90 font-medium">Session matched</div>
          <div className="text-white/80 text-sm">Already paired</div>
        </div>
      );
    }

    if (!slot.available || slot.status === 'unavailable') {
      return (
        <div className="flex-1 space-y-1">
          <div className="text-gray-500 font-medium">Unavailable</div>
          <div className="text-gray-400 text-sm">Not bookable</div>
        </div>
      );
    }

    // Available - Apple style text
    return (
      <div className="flex-1 space-y-1">
        <div className="text-gray-900 font-semibold">Create session</div>
        <div className="text-gray-600 text-sm">Wait for a partner</div>
      </div>
    );
  };

  const getActionButton = () => {
    if (slot.status === 'waiting') {
      return (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-white text-emerald-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-bounce">
            MATCH
          </div>
        </div>
      );
    }

    if (slot.available && slot.status === 'available') {
      return (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1 bg-blue-100 rounded-full">
            <ChevronRight className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      );
    }

    return null;
  };

  const getTooltip = () => {
    if (slot.status === 'waiting' && slot.waitingUser) {
      return `Match with ${slot.waitingUser.firstName} for ${slot.waitingUser.duration}min session at ${slot.time}`;
    }
    if (slot.status === 'unavailable') {
      return 'This time slot is not available';
    }
    return `Book a session at ${slot.time}`;
  };

  return (
    <div
      className={getCardClassName()}
      onClick={handleClick}
      title={getTooltip()}
    >
      {/* Background decoration */}
      {slot.status === 'waiting' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-0" />
      )}
      
      {/* Action button */}
      {getActionButton()}

      {/* Main content */}
      <div className="relative flex flex-col h-full">
        {/* Icon */}
        <div className="mb-3">
          {getMainIcon()}
        </div>

        {/* Time */}
        <div className="mb-2">
          {getTimeDisplay()}
        </div>

        {/* Status content */}
        {getStatusContent()}

        {/* Ripple effect for clicks */}
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 transition-colors duration-150" />
        </div>
      </div>
    </div>
  );
}