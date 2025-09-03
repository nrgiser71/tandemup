'use client';

import { useState, useEffect } from 'react';
import { generateTimeSlots } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { SessionCard } from './SessionCard';

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


  if (loading) {
    return (
      <div className="space-y-6">
        {/* Date Header Skeleton */}
        <div className="text-center">
          <div className="h-6 bg-gray-100 rounded-lg w-64 mx-auto animate-pulse"></div>
        </div>

        {/* Skeleton Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="min-h-[140px] p-5 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 bg-gray-100 rounded-full mb-3"></div>
                <div className="h-8 bg-gray-100 rounded-lg w-20 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-base-content/70 text-sm">Loading available times...</span>
        </div>
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

      {/* Time Slots Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {timeSlots.map((slot, index) => {
          if (index === 0) console.log('First slot debug:', { available: slot.available, status: slot.status, slot });
          return (
            <SessionCard
              key={`${slot.date}-${slot.time}`}
              slot={slot}
              onClick={() => {
                console.log('Slot clicked:', { available: slot.available, status: slot.status, slot });
                onSlotClick(slot);
              }}
            />
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