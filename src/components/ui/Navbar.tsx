'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { ROUTES } from '@/lib/constants';
import { Users, Calendar, User, Settings, Sparkles } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="navbar bg-base-100/95 backdrop-blur-md shadow-soft border-b border-base-300/50 sticky top-0 z-50 transition-smooth">
      <div className="navbar-start">
        <Link href={ROUTES.HOME} className="btn btn-ghost text-xl font-bold text-primary hover:bg-primary/10 transition-smooth group">
          <Users className="w-6 h-6 group-hover:scale-110 transition-bounce" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TandemUp
          </span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {user && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 hover:bg-primary/10 transition-smooth rounded-lg font-medium">
                <Calendar className="w-4 h-4 text-primary" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href={ROUTES.BOOK_SESSION} className="flex items-center gap-2 hover:bg-secondary/10 transition-smooth rounded-lg font-medium">
                <Calendar className="w-4 h-4 text-secondary" />
                Book Session
              </Link>
            </li>
            <li>
              <Link href={ROUTES.MY_SESSIONS} className="flex items-center gap-2 hover:bg-accent/10 transition-smooth rounded-lg font-medium">
                <User className="w-4 h-4 text-accent" />
                My Sessions
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="flex items-center gap-2 hover:bg-success/10 transition-smooth rounded-lg font-medium">
                <Settings className="w-4 h-4 text-success" />
                Pricing
              </Link>
            </li>
          </ul>
        )}
      </div>

      <div className="navbar-end">
        {user ? (
          <UserMenu user={user} profile={profile} onSignOut={signOut} />
        ) : (
          <div className="flex gap-3">
            <Link href={ROUTES.SIGN_IN} className="btn btn-ghost font-medium hover:bg-base-200 transition-smooth">
              Sign In
            </Link>
            <Link href={ROUTES.SIGN_UP} className="btn btn-primary btn-modern font-medium shadow-medium hover:shadow-large hover:scale-105 transition-smooth">
              Start Free Trial
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}