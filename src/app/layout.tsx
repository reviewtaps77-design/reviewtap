import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { FirebaseProvider } from '@/components/firebase-provider';
import { AutoRefreshOnIdle } from '@/components/auto-refresh-on-idle';
import favicon from '../../icon.jpeg';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ReviewTap - Turn Every Customer Experience Into a Review',
    template: '%s | ReviewTap',
  },
  description:
    'ReviewTap helps businesses collect authentic Google reviews through QR codes, NFC cards, and AI-powered review assistance. Track employee performance and grow your online reputation.',
  icons: {
    icon: favicon.src,
  },
  keywords: [
    'QR review card',
    'NFC review',
    'Google review QR code',
    'employee rating QR',
    'customer feedback system',
    'review management platform',
    'employee performance tracking',
    'NFC tap review',
    'QR code review collection',
    'business review system',
  ],
  openGraph: {
    title: 'ReviewTap - Turn Every Customer Experience Into a Review',
    description:
      'Collect authentic reviews via QR & NFC. Track employee performance. Grow your online reputation.',
    type: 'website',
    siteName: 'ReviewTap',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <FirebaseProvider />
        <AutoRefreshOnIdle />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
