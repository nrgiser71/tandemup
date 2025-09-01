'use client';

import { ReactNode } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Users } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200/50 to-base-100">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      
      {/* Modern footer */}
      <footer className="bg-neutral text-neutral-content mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center gap-2 text-xl font-bold">
              <Users className="w-6 h-6" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                TandemUp
              </span>
            </div>
            <p className="text-neutral-content/70 max-w-md mx-auto">
              Virtual coworking sessions that boost productivity through accountability and focused work time.
            </p>
            <div className="text-sm text-neutral-content/50">
              © 2024 TandemUp. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}