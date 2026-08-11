import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import AmplifiOnboardingClient from './AmplifiOnboardingClient';

export const metadata: Metadata = {
  title: 'Amplifi — Brand setup',
  description: 'Set up your brand, audience, voice, objectives, and social channels for Amplifi.',
};

export const dynamic = 'force-dynamic';

export default async function AmplifiOnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <AmplifiOnboardingClient
      loggedIn={Boolean(session)}
      slug={session?.slug ?? null}
    />
  );
}
