// Booking and session related types

export interface TimeSlot {
  date: string;
  time: string;
  datetime: string;
  available: boolean;
  status: 'available' | 'waiting' | 'matched' | 'unavailable';
  waitingUser?: {
    firstName: string;
    duration: 25 | 50;
  };
}

export interface BookingRequest {
  datetime: string;
  duration: 25 | 50;
  action: 'create' | 'join';
  sessionId?: string;
}

export interface SessionDetails {
  id: string;
  startTime: string;
  duration: 25 | 50;
  status: 'waiting' | 'matched' | 'completed' | 'cancelled' | 'no_show';
  partner?: {
    id: string;
    firstName: string;
    avatarUrl?: string;
  };
  jitsiRoomName?: string;
  canCancel: boolean;
  canJoin: boolean;
}

export interface SessionPhase {
  phase: 'waiting' | 'checkin' | 'focus' | 'checkout' | 'ended';
  timeRemaining: number;
  totalTime: number;
}

export interface NoShowReport {
  sessionId: string;
  reportedUserId: string;
  reason: string;
}