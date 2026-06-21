import type { Metadata } from 'next';
import './simplifi-capture.css';

export const metadata: Metadata = {
  title: 'Simplifi Capture — One Tap',
  description: 'Capture opportunities from your phone with Simplifi.',
  manifest: '/manifest-simplifi.json',
  appleWebApp: {
    capable: true,
    title: 'Simplifi',
  },
};

export default function SimplifiCaptureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
