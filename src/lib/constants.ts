// Application constants

export const LANGUAGES = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'nl' as const, name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'fr' as const, name: 'French', nativeName: 'Français' },
  { code: 'es' as const, name: 'Spanish', nativeName: 'Español' },
  { code: 'de' as const, name: 'German', nativeName: 'Deutsch' },
];

export const SESSION_DURATIONS = [25, 50] as const;

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const SESSION_STATUS = {
  WAITING: 'waiting',
  MATCHED: 'matched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const SESSION_PHASES = {
  WAITING: 'waiting',
  CHECKIN: 'checkin',
  FOCUS: 'focus',
  CHECKOUT: 'checkout',
  ENDED: 'ended',
} as const;

export const TRIAL_DURATION_DAYS = 14;
export const CHECKIN_DURATION = 2 * 60; // 2 minutes in seconds
export const CHECKOUT_DURATION = 2 * 60; // 2 minutes in seconds

export const PRICING = {
  MONTHLY: 9.99,
  YEARLY: 79.99,
  YEARLY_MONTHLY: 6.67,
} as const;

export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', offset: '+01:00' },
  { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: '+01:00' },
  { value: 'America/New_York', label: 'New York', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Chicago', offset: '-06:00' },
  { value: 'America/Denver', label: 'Denver', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: '+11:00' },
];

export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  SESSION_BOOKED: 'session-booked',
  MATCH_FOUND: 'match-found',
  SESSION_REMINDER: 'session-reminder',
  NO_MATCH_WARNING: 'no-match-warning',
  NO_SHOW_REPORT: 'no-show-report',
  TRIAL_ENDING: 'trial-ending',
  SUBSCRIPTION_CONFIRMED: 'subscription-confirmed',
} as const;

export const ROUTES = {
  HOME: '/',
  SIGN_UP: '/signup',
  SIGN_IN: '/signin',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  BOOK_SESSION: '/book',
  MY_SESSIONS: '/sessions',
  PROFILE: '/profile',
  ADMIN: '/admin',
  SESSION_ROOM: '/session',
} as const;