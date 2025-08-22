import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nilCC Workload Manager",
  description: "Manage your nilCC workloads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/nillion.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <SettingsProvider>
          <Navbar />
          <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
