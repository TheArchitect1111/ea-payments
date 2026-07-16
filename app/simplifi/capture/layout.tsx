import type { Metadata, Viewport } from 'next';
import './simplifi-capture.css';
import SimplifiCaptureSwRegister from './SimplifiCaptureSwRegister';

export const metadata: Metadata = {
  title: 'Simplifi — Quick Capture',
  description: 'One-tap capture — then return to Today\'s Brief.',
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
  themeColor: '#1B2B4D',
};

export default function SimplifiCaptureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SimplifiCaptureSwRegister />
      {children}
    </>
  );
}
