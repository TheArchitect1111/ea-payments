import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Amplifi™ — Amplify & Share',
  description: 'One tap to amplify any page into a shareable Magnifi story.',
  manifest: '/manifest-amplifi.json',
  appleWebApp: { capable: true, title: 'Amplifi' },
};

export default function AmplifiShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
