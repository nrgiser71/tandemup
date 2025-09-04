'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { CalendarGrid } from '@/components/features/CalendarGrid';
import { BookingModal } from '@/components/features/BookingModal';
import { addDays } from '@/lib/utils';
import { TimeSlot } from '@/types';
import { Calendar, Users, Clock, AlertCircle, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookSessionPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to signin');
      window.location.href = '/signin';
      return;
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Show login message if no user (while redirect is happening)
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-lg max-w-md">
          <div className="card-body text-center">
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h2 className="card-title justify-center mb-2">Login Required</h2>
            <p className="text-base-content/70 mb-4">
              You need to log in to book a session.
            </p>
            <div className="card-actions justify-center">
              <a href="/signin" className="btn btn-primary">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
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
              userLanguage={profile.languages?.[0] || 'en'}
            />

            {/* Apple-Style Floating Legend */}
            <div className="mt-8">
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                <div className="flex items-center justify-center flex-wrap gap-6 text-sm">
                  {/* Partner Waiting */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">Partner waiting</span>
                      <span className="text-xs text-gray-600">Join instantly</span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      MATCH
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>

                  {/* Available */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">Available</span>
                      <span className="text-xs text-gray-600">Create session</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-12 bg-gray-200 hidden lg:block"></div>

                  {/* Unavailable */}
                  <div className="flex items-center gap-3 opacity-70">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                      <X className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-500">Unavailable</span>
                      <span className="text-xs text-gray-400">Not bookable</span>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="flex items-center justify-center mt-6 pt-4 border-t border-gray-200/60">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Green cards show when partners are ready - click to match!</span>
                  </div>
                </div>
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