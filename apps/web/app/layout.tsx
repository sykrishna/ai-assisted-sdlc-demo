import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI-Assisted SDLC Web',
  description: 'Enterprise web shell for AI-assisted cloud-native delivery',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
