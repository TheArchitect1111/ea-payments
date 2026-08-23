import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import IdeaBoxClient from './IdeaBoxClient';
import './idea-box.css';

export const metadata: Metadata = {
  title: 'Idea Box | Amplifi',
  description: 'Drop in rough ideas, links and assets. Amplifi finds the content opportunities.',
};

export const dynamic = 'force-dynamic';

export default async function IdeaBoxPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return <IdeaBoxClient loggedIn={Boolean(session)} />;
}
