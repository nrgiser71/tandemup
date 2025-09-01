# TandemUp - Virtual Coworking Platform

TandemUp is a virtual coworking platform that pairs users for focused work sessions via video calls. Users book 25 or 50-minute sessions, get matched with accountability partners, and work together with cameras on to maintain focus and productivity.

## Features

### 🎯 Core Features
- **Session Booking**: Book 25 or 50-minute focused work sessions
- **Instant Matching**: Get paired with compatible partners automatically
- **Video Sessions**: Structured sessions with check-in, focus time, and check-out
- **Language Support**: Match with users speaking the same language (EN, NL, FR)
- **Mobile-Responsive**: Works on desktop (video sessions require desktop)

### 🔐 Authentication & Profiles
- Email/password authentication with Supabase Auth
- User profiles with language and timezone preferences
- Profile picture upload support
- Account management and settings

### 💳 Subscription System
- 14-day free trial (no credit card required)
- Monthly (€9.99) and yearly (€79.99) subscriptions
- Stripe integration for payments
- Customer portal for subscription management

### 🛡️ Trust & Safety
- Community guidelines enforcement
- Strike system for violations
- In-session reporting functionality
- No-show tracking and policies

### 📊 Analytics & Tracking
- Session completion statistics
- User activity tracking
- Admin dashboard with metrics
- Email notification system

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS + DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Mailgun
- **Video**: Jitsi Meet External API
- **Hosting**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)
- Mailgun account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tandemup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # Mailgun
   MAILGUN_API_KEY=your_mailgun_api_key
   MAILGUN_DOMAIN=your_mailgun_domain

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ADMIN_EMAIL=admin@tandemup.work
   ```

4. **Set up Supabase database**
   Run the SQL schema in `database/schema.sql` in your Supabase SQL editor.

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. **Connect your repository to Vercel**
2. **Set up environment variables** in your Vercel dashboard
3. **Configure domain**: Set up `tandemup.work` as your custom domain
4. **Enable cron jobs** as configured in `vercel.json`

## Project Structure

```
/app                    # Next.js app router
  /(auth)              # Authentication pages
  /(dashboard)         # User dashboard pages
  /(admin)             # Admin panel pages (future)
  /api                 # API routes
/components            # React components
  /ui                  # Base UI components
  /features            # Feature-specific components
  /layouts             # Page layouts
/lib                   # Utilities and configurations
  /supabase            # Supabase client setup
  /stripe              # Stripe utilities (future)
  /mailgun             # Email functions (future)
/hooks                 # Custom React hooks
/types                 # TypeScript type definitions
/contexts              # React context providers
/database              # Database schema and migrations
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Sessions
- `GET /api/sessions/available` - Get available time slots
- `POST /api/sessions/book` - Book a new session
- `GET /api/sessions/my-sessions` - Get user's sessions
- `DELETE /api/sessions/my-sessions` - Cancel a session

### Cron Jobs (Vercel)
- `/api/cron/match-sessions` - Auto-match users (every 5 min)
- `/api/cron/send-reminders` - Send email reminders (hourly)
- `/api/cron/check-no-shows` - Check for no-shows (every 10 min)
- `/api/cron/trial-expiry` - Handle trial expiry (daily)

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Use Prettier for code formatting (`npm run format`)
- Run type checking with `npm run typecheck`)

### Database Changes
- Create migrations for schema changes
- Update TypeScript types in `/types/database.ts`
- Test with both development and production data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@tandemup.work or create an issue in the repository.

---

Built with ❤️ for productive remote work.
