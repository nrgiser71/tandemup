import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TandemUp - Virtual Coworking Sessions',
  description:
    'Join focused work sessions with accountability partners via video calls.',
  keywords: [
    'coworking',
    'productivity',
    'focus',
    'video calls',
    'accountability',
    'remote work',
  ],
  authors: [{ name: 'TandemUp' }],
  creator: 'TandemUp',
  publisher: 'TandemUp',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tandemup.work',
    siteName: 'TandemUp',
    title: 'TandemUp - Virtual Coworking Sessions',
    description:
      'Join focused work sessions with accountability partners via video calls.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TandemUp - Virtual Coworking Sessions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TandemUp - Virtual Coworking Sessions',
    description:
      'Join focused work sessions with accountability partners via video calls.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="tandemup">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
