import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from "next/script";
import './globals.css';
import { SettingsProvider } from '@/contexts/SettingsContext';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'nilCC Workload Manager',
  description: 'Create and manage your nilCC workloads',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/nillion.css" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <SettingsProvider>
          <Navbar />
          <main
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              padding: '1.5rem 1rem',
            }}
          >
            {children}
          </main>
        </SettingsProvider>
      </body>
      <Script
        async
        src="https://cloud.umami.is/script.js"
        data-website-id="91805735-d0c7-4a08-ba09-75ccfd5601ee"
      />
    </html>
  );
}