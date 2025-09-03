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
      group relative min-h-[140px] p-4 rounded-xl transition-all duration-300 cursor-pointer
      border backdrop-blur-sm overflow-hidden
    `;

    if (!slot.available || slot.status === 'unavailable') {
      return `${baseClasses}
        bg-gray-50 border-gray-200 cursor-not-allowed opacity-60
        dark:bg-gray-800/50 dark:border-gray-700
        relative before:absolute before:inset-0 
        before:bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.05)_8px,rgba(0,0,0,0.05)_16px)]
      `;
    }

    if (slot.status === 'waiting') {
      return `${baseClasses}
        bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400
        text-white shadow-lg shadow-emerald-500/25
        hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] hover:-translate-y-1
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent
        ring-1 ring-white/20 animate-pulse hover:animate-none
      `;
    }

    if (slot.status === 'matched') {
      return `${baseClasses}
        bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400
        text-white shadow-lg shadow-blue-500/25
        hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] hover:-translate-y-1
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent
        ring-1 ring-white/20
      `;
    }

    // Default available
    return `${baseClasses}
      bg-gradient-to-br from-slate-50 to-zinc-100 border-slate-200
      hover:from-slate-100 hover:to-zinc-200 hover:border-orange-300
      hover:shadow-lg hover:shadow-slate-300/50 hover:scale-[1.02] hover:-translate-y-1
      dark:from-slate-800 dark:to-zinc-800 dark:border-slate-700
      dark:hover:from-slate-700 dark:hover:to-zinc-700 dark:hover:border-orange-500
      relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent
    `;
  };

  const getMainIcon = () => {
    const iconClasses = "w-8 h-8 mb-2";
    
    if (slot.status === 'waiting') {
      return (
        <div className="relative">
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
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
        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
          <UserCheck className={`${iconClasses} text-white`} />
        </div>
      );
    }

    if (!slot.available || slot.status === 'unavailable') {
      return (
        <div className="p-2 bg-gray-100 rounded-full">
          <Lock className={`${iconClasses} text-gray-400`} />
        </div>
      );
    }

    // Available
    return (
      <div className="p-2 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
        <Plus className={`${iconClasses} text-orange-600 group-hover:text-orange-700`} />
      </div>
    );
  };

  const getTimeDisplay = () => {
    const timeClasses = slot.status === 'waiting' || slot.status === 'matched' 
      ? "text-2xl font-bold text-white" 
      : "text-2xl font-bold text-slate-800 dark:text-slate-200";
    
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
          <div className="text-gray-600 dark:text-gray-400 font-medium">Unavailable</div>
          <div className="text-gray-500 dark:text-gray-500 text-sm">Not bookable</div>
        </div>
      );
    }

    // Available
    return (
      <div className="flex-1 space-y-1">
        <div className="text-slate-700 dark:text-slate-300 font-medium">Create session</div>
        <div className="text-slate-600 dark:text-slate-400 text-sm">Wait for a partner</div>
      </div>
    );
  };

  const getActionButton = () => {
    if (slot.status === 'waiting') {
      return (
        <div className="absolute top-3 right-3">
          <div className="bg-white text-emerald-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-bounce">
            JOIN NOW!
          </div>
        </div>
      );
    }

    if (slot.available && slot.status === 'available') {
      return (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-orange-600" />
        </div>
      );
    }

    return null;
  };

  const getTooltip = () => {
    if (slot.status === 'waiting' && slot.waitingUser) {
      return `Join ${slot.waitingUser.firstName}'s ${slot.waitingUser.duration}min session at ${slot.time}`;
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
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
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