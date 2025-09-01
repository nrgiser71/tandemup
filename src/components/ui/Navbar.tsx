'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from './UserMenu';
import { ROUTES } from '@/lib/constants';
import { Users, Calendar, User, Settings, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <Link href={ROUTES.HOME} className="btn btn-ghost text-xl">
          <Users className="w-6 h-6" />
          TandemUp
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        {user && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href={ROUTES.BOOK_SESSION} className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Book Session
              </Link>
            </li>
            <li>
              <Link href={ROUTES.MY_SESSIONS} className="flex items-center gap-2">
                <User className="w-4 h-4" />
                My Sessions
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
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
          <div className="flex gap-2">
            <Link href={ROUTES.SIGN_IN} className="btn btn-ghost">
              Sign In
            </Link>
            <Link href={ROUTES.SIGN_UP} className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}