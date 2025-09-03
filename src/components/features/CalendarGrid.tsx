'use client';

import { useState, useEffect } from 'react';
import { generateTimeSlots } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { Clock, Users, Loader2, Plus, X, Calendar, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CalendarGridProps {
  selectedDate: Date;
  onSlotClick: (slot: TimeSlot) => void;
  userLanguage: 'en' | 'nl' | 'fr';
}

export function CalendarGrid({
  selectedDate,
  onSlotClick,
  userLanguage,
}: CalendarGridProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTimeSlotsForDate();
  }, [selectedDate, userLanguage]);

  const generateTimeSlotsForDate = async () => {
    setLoading(true);
    
    try {
      
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Fetch available slots from API
      const response = await fetch(`/api/sessions/available?date=${selectedDate.toISOString().split('T')[0]}&timezone=${encodeURIComponent(userTimezone)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch available slots: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('CalendarGrid API response:', result);
      setTimeSlots(result.data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      
      // Fallback to basic time slots if API fails
      const slots = generateTimeSlots(selectedDate);
      const basicSlots: TimeSlot[] = slots.map(slot => ({
        ...slot,
        date: selectedDate.toISOString().split('T')[0],
        available: true, // Change this to true for testing
        status: 'available',
      }));
      
      console.log('CalendarGrid fallback slots:', basicSlots);
      setTimeSlots(basicSlots);
    } finally {
      setLoading(false);
    }
  };

  const getSlotClassName = (slot: TimeSlot) => {
    const baseClasses = 'btn btn-sm h-14 flex-col gap-1 p-2 transition-all duration-300 relative';
    
    if (!slot.available || slot.status === 'unavailable') {
      return `${baseClasses} btn-disabled bg-base-200 text-base-content/30 cursor-not-allowed opacity-50`;
    }
    
    if (slot.status === 'waiting') {
      return `${baseClasses} bg-success hover:bg-success-focus text-success-content font-semibold 
              ring-2 ring-success ring-opacity-50 animate-pulse hover:animate-none hover:scale-105 
              shadow-lg hover:shadow-xl cursor-pointer`;
    }
    
    if (slot.status === 'matched') {
      return `${baseClasses} bg-info hover:bg-info-focus text-info-content`;
    }
    
    // Check if this is user's own session by looking at session data
    // We'll add this logic when we have the user context
    
    // Default available
    return `${baseClasses} bg-base-100 hover:bg-base-200 border-2 border-base-300 
            hover:border-warning text-base-content hover:scale-105 cursor-pointer`;
  };

  const getSlotIcon = (slot: TimeSlot) => {
    const iconSize = "w-5 h-5";
    
    if (slot.status === 'waiting') {
      return (
        <div className="relative">
          <Users className={`${iconSize} text-success-content`} />
          <div className="absolute -top-1 -right-1 bg-success-content text-success rounded-full w-3 h-3 flex items-center justify-center text-xs font-bold">
            1
          </div>
        </div>
      );
    }
    
    if (slot.status === 'matched') {
      return <UserCheck className={`${iconSize} text-info-content`} />;
    }
    
    if (!slot.available || slot.status === 'unavailable') {
      return <X className={`${iconSize} text-base-content/30`} />;
    }
    
    // Default available
    return <Plus className={`${iconSize} text-base-content/60`} />;
  };

  const getSlotContent = (slot: TimeSlot) => {
    if (slot.status === 'waiting' && slot.waitingUser) {
      return (
        <>
          <span className="text-sm font-bold text-success-content">{slot.time}</span>
          <div className="text-center">
            <div className="text-sm font-semibold text-success-content">
              {slot.waitingUser.firstName}
            </div>
            <div className="inline-flex items-center justify-center bg-success-content text-success text-xs font-bold px-1.5 py-0.5 rounded-full mt-0.5">
              {slot.waitingUser.duration}min
            </div>
          </div>
          <div className="absolute top-1 right-1 bg-success-content text-success text-xs font-bold px-1 py-0.5 rounded text-center leading-none">
            JOIN
          </div>
        </>
      );
    }
    
    if (!slot.available || slot.status === 'unavailable') {
      return (
        <>
          <span className="text-sm font-medium text-base-content/30">{slot.time}</span>
          <span className="text-xs text-base-content/20">Unavailable</span>
        </>
      );
    }
    
    return (
      <>
        <span className="text-sm font-medium text-base-content">{slot.time}</span>
        <span className="text-xs text-base-content/60">Available</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-base-content/70">Loading available times...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h3>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {timeSlots.map((slot, index) => {
          if (index === 0) console.log('First slot debug:', { available: slot.available, status: slot.status, slot });
          return (
            <button
              key={`${slot.date}-${slot.time}`}
              onClick={() => {
                console.log('Slot clicked:', { available: slot.available, status: slot.status, slot });
                slot.available && onSlotClick(slot);
              }}
              className={getSlotClassName(slot)}
              disabled={!slot.available}
              title={
                slot.status === 'waiting' && slot.waitingUser
                  ? `Join ${slot.waitingUser.firstName}'s ${slot.waitingUser.duration}min session`
                  : slot.status === 'unavailable'
                  ? 'This time slot is not available'
                  : 'Book this time slot'
              }
            >
              <div className="flex items-center gap-1">
                {getSlotIcon(slot)}
              </div>
              {getSlotContent(slot)}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {timeSlots.length === 0 && (
        <div className="text-center py-12 text-base-content/60">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No time slots available</p>
          <p>Please select a different date.</p>
        </div>
      )}
    </div>
  );
}