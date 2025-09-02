'use client';

import { useState, useEffect } from 'react';
import { generateTimeSlots } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { Clock, Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
      const supabase = createClient();
      
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Fetch available slots from API
      const response = await fetch(`/api/sessions/available?date=${selectedDate.toISOString().split('T')[0]}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
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
    const baseClasses = 'btn btn-sm h-12 flex-col gap-1 p-2 transition-all duration-200';
    
    if (!slot.available || slot.status === 'unavailable') {
      return `${baseClasses} btn-disabled bg-base-300 text-base-content/40`;
    }
    
    if (slot.status === 'waiting') {
      return `${baseClasses} btn-success hover:scale-105`;
    }
    
    if (slot.status === 'matched') {
      return `${baseClasses} btn-info`;
    }
    
    // Default available
    return `${baseClasses} btn-warning hover:scale-105`;
  };

  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.status === 'waiting') {
      return <Users className="w-3 h-3" />;
    }
    
    if (slot.status === 'matched') {
      return <Users className="w-3 h-3" />;
    }
    
    return <Clock className="w-3 h-3" />;
  };

  const getSlotContent = (slot: TimeSlot) => {
    if (slot.status === 'waiting' && slot.waitingUser) {
      return (
        <>
          <span className="text-xs font-medium">{slot.time}</span>
          <div className="text-xs opacity-90 leading-tight">
            {slot.waitingUser.firstName}
            <br />
            {slot.waitingUser.duration}min
          </div>
        </>
      );
    }
    
    return (
      <>
        <span className="text-xs font-medium">{slot.time}</span>
        <span className="text-xs opacity-75">Available</span>
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