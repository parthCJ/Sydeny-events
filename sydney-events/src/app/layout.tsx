import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sydney Events - Discover What\'s On in Sydney',
  description: 'Your ultimate guide to events, concerts, festivals, and activities in Sydney, Australia. Automatically updated with the latest happenings.',
  keywords: 'Sydney events, Sydney concerts, Sydney festivals, things to do Sydney, Sydney activities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
