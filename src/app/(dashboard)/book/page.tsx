'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CalendarGrid } from '@/components/features/CalendarGrid';
import { BookingModal } from '@/components/features/BookingModal';
import { addDays } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { Calendar, Users, Clock } from 'lucide-react';

export default function BookSessionPage() {
  const { user, profile, loading } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingComplete = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    // Refresh the calendar data
    // TODO: Implement refresh logic
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Book a Session</h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Choose a time that works for you. Get matched instantly or create a new session 
            and wait for a partner to join.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="card-body text-center">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-primary mb-2">Instant Match</h3>
              <p className="text-sm text-base-content/70">
                🟢 Green slots have partners waiting - join instantly!
              </p>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
            <div className="card-body text-center">
              <Calendar className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold text-secondary mb-2">Create Session</h3>
              <p className="text-sm text-base-content/70">
                🟡 Yellow slots let you create a new session and wait for a match.
              </p>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
            <div className="card-body text-center">
              <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="font-semibold text-accent mb-2">Choose Duration</h3>
              <p className="text-sm text-base-content/70">
                Select 25 or 50-minute sessions based on your needs.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Select Date & Time</h2>
              
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                  className="btn btn-sm btn-outline"
                  disabled={selectedDate <= new Date()}
                >
                  ←
                </button>
                
                <span className="text-sm font-medium min-w-32 text-center">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                
                <button
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="btn btn-sm btn-outline"
                  disabled={selectedDate >= addDays(new Date(), 6)}
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <CalendarGrid
              selectedDate={selectedDate}
              onSlotClick={handleSlotClick}
              userLanguage={profile.language}
            />

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-success rounded"></div>
                <span>Partner waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-base-300 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && selectedSlot && (
          <BookingModal
            slot={selectedSlot}
            userProfile={profile}
            onClose={() => setShowBookingModal(false)}
            onComplete={handleBookingComplete}
          />
        )}
      </div>
    </AppLayout>
  );
}