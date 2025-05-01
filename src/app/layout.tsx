
/**
 * Root layout component for the OTP Manager Pro application.
 * This file defines the base HTML structure, fonts, and global components.
 */
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {Toaster} from "@/components/ui/toaster";

/**
 * Geist Sans font configuration for the application.
 * Used as the primary font for most text content.
 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

/**
 * Geist Mono font configuration for the application.
 * Used for code blocks, monospaced text, and other technical content.
 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Metadata for the application, used by Next.js for SEO and document head.
 */
export const metadata: Metadata = {
  title: 'OTP Manager Pro',
  description: 'A secure and user-friendly application for managing and generating One-Time Passwords (OTP)',
};

/**
 * Root layout component that wraps all pages in the application.
 * Provides the HTML structure, applies fonts, and includes global components like the Toaster.
 * 
 * @param props - Component properties
 * @param props.children - The page content to render within the layout
 * @returns The complete HTML structure with the page content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
