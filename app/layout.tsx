import type { Metadata, Viewport } from 'next';
import EAGuideOrb from './components/ea-guide/EAGuideOrb';
import './globals.css';

export const metadata: Metadata = {
  title: 'EA Athletics Experience - Coach Again',
  description:
    'A coach-centered journey showing how an athletics landing page and portal help programs grow without pulling coaches away from athletes.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-ea-guide="dashboard">
        {children}
        <EAGuideOrb />
      </body>
    </html>
  );
}
