import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: "Simplifi — Today's Brief",
  description: 'What deserves your attention — opportunity intelligence from Efficiency Architects.',
  manifest: '/manifest-simplifi.json',
  appleWebApp: {
    capable: true,
    title: 'Simplifi',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B2B4D',
};

export default function SimplifiWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
