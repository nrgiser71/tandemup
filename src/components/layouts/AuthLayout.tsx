'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href={ROUTES.HOME} className="inline-flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">TandemUp</span>
            </Link>
          </div>

          {/* Auth Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-base-content/60">{subtitle}</p>}
              </div>
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-base-content/60">
            <p>
              By continuing, you agree to our{' '}
              <Link href="/terms" className="link link-primary">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="link link-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}