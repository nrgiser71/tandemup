'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { ROUTES } from '@/lib/constants';
import { User as UserIcon, Settings, LogOut, Calendar } from 'lucide-react';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
  onSignOut: () => void;
}

export function UserMenu({ user, profile, onSignOut }: UserMenuProps) {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.first_name}
              className="rounded-full"
            />
          ) : (
            <div className="bg-primary/20 w-full h-full rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li>
          <div className="justify-between">
            <span className="font-medium">
              {profile?.first_name || user.email}
            </span>
            {profile?.subscription_status === 'trial' && (
              <span className="badge badge-sm badge-warning">Trial</span>
            )}
          </div>
        </li>
        <div className="divider my-1"></div>
        <li className="lg:hidden">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dashboard
          </Link>
        </li>
        <li className="lg:hidden">
          <Link href={ROUTES.BOOK_SESSION} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Book Session
          </Link>
        </li>
        <li className="lg:hidden">
          <Link href={ROUTES.MY_SESSIONS} className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            My Sessions
          </Link>
        </li>
        <li className="lg:hidden">
          <div className="divider my-1"></div>
        </li>
        <li>
          <Link href={ROUTES.PROFILE} className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Profile
          </Link>
        </li>
        <li>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 text-error"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}