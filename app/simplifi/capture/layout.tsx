import type { Metadata, Viewport } from 'next';
import './simplifi-capture.css';
import SimplifiCaptureSwRegister from './SimplifiCaptureSwRegister';

export const metadata: Metadata = {
  title: 'Simplifi Capture — One Tap',
  description: 'Capture opportunities from your phone with Simplifi.',
  manifest: '/manifest-simplifi.json',
  appleWebApp: {
    capable: true,
    title: 'Simplifi',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A66FF',
};

export default function SimplifiCaptureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SimplifiCaptureSwRegister />
      {children}
    </>
  );
}
