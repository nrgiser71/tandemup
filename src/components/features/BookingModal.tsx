'use client';

import { useState } from 'react';
import { TimeSlot, Profile } from '@/types';
import { SESSION_DURATIONS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { 
  X, 
  Users, 
  Clock, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react';

interface BookingModalProps {
  slot: TimeSlot;
  userProfile: Profile;
  onClose: () => void;
  onComplete: () => void;
}

export function BookingModal({
  slot,
  userProfile,
  onClose,
  onComplete,
}: BookingModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<25 | 50>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isJoiningExisting = slot.status === 'waiting' && slot.waitingUser;
  const waitingUser = slot.waitingUser;

  const handleBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in to book a session');
      }

      const bookingData = {
        datetime: slot.datetime,
        duration: isJoiningExisting ? waitingUser!.duration : selectedDuration,
        action: isJoiningExisting ? 'join' : 'create',
        sessionId: isJoiningExisting ? slot.sessionId : undefined,
      };

      console.log('BookingModal - Sending booking request:', {
        isJoiningExisting,
        slotDetails: {
          datetime: slot.datetime,
          time: slot.time,
          status: slot.status,
          sessionId: slot.sessionId,
          waitingUser: slot.waitingUser
        },
        bookingData,
        userProfile: {
          id: userProfile.id,
          firstName: userProfile.first_name,
          language: userProfile.language
        }
      });

      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      console.log('BookingModal - Server response:', {
        status: response.status,
        ok: response.ok,
        result
      });

      if (!response.ok) {
        const errorMessage = result.error || `Failed to book session (${response.status})`;
        console.error('BookingModal - Booking failed:', {
          status: response.status,
          error: result.error,
          fullResult: result
        });
        throw new Error(errorMessage);
      }

      // Show success message briefly before closing
      setError(null);
      
      // Wait a moment to show success, then complete
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book session. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">
            {isJoiningExisting ? 'Join Session' : 'Book New Session'}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session Details */}
        <div className="space-y-4 mb-6">
          {/* Date & Time */}
          <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">{formatDateTime(slot.datetime)}</div>
              <div className="text-sm text-base-content/60">
                {slot.time} • {new Date(slot.datetime).toLocaleDateString('en-US', { 
                  weekday: 'long' 
                })}
              </div>
            </div>
          </div>

          {/* Partner Info (if joining existing) */}
          {isJoiningExisting && waitingUser && (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <Users className="w-5 h-5 text-success" />
              <div className="flex-1">
                <div className="font-medium text-success">
                  Partner: {waitingUser.firstName}
                </div>
                <div className="text-sm text-base-content/60">
                  Ready to start a {waitingUser.duration}-minute session
                </div>
              </div>
              <div className="badge badge-success badge-sm">
                Instant Match!
              </div>
            </div>
          )}

          {/* Duration Selection (for new sessions) */}
          {!isJoiningExisting && (
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-medium">Session Duration</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SESSION_DURATIONS.map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`btn ${
                      selectedDuration === duration
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {duration} min
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <User className="w-5 h-5 text-accent" />
            <div>
              <div className="font-medium">You: {userProfile.first_name}</div>
              <div className="text-sm text-base-content/60">
                Language: {userProfile.language.toUpperCase()} • 
                Timezone: {userProfile.timezone}
              </div>
            </div>
          </div>
        </div>

        {/* Session Structure Info */}
        <div className="alert alert-info mb-6">
          <Clock className="w-4 h-4" />
          <div className="text-sm">
            <div className="font-medium mb-1">Session Structure:</div>
            <div>
              • 2min Check-in (introduce goals)
              <br />
              • {isJoiningExisting ? waitingUser!.duration - 4 : selectedDuration - 4}min Focus time (cameras on)
              <br />
              • 2min Check-out (share progress)
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="modal-action">
          <button
            onClick={onClose}
            className="btn btn-ghost"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleBooking}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isJoiningExisting ? 'Join Session' : 'Book Session'}
          </button>
        </div>

        {/* Terms */}
        <div className="text-xs text-base-content/60 text-center mt-4">
          By booking, you agree to keep your camera on during the session and 
          follow our community guidelines.
        </div>
      </div>
    </div>
  );
}