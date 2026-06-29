import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import EAGuideOrb from './components/ea-guide/EAGuideOrb';
import './globals.css';

export const metadata: Metadata = {
  title: 'EA Athletics Experience - Coach Again',
  description:
    'A coach-centered journey showing how an athletics landing page and portal help programs grow without pulling coaches away from athletes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const page = (
    <html lang="en">
      <body data-ea-guide="dashboard">
        {children}
        <EAGuideOrb />
      </body>
    </html>
  );

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publishableKey ? <ClerkProvider publishableKey={publishableKey}>{page}</ClerkProvider> : page;
}
