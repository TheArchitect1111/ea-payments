import { cookies } from 'next/headers';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import TryTestingHub from './TryTestingHub';

export const metadata = {
  title: 'Try Simplifi · Tester kit',
  description: 'Sign in once and test every Simplifi and portal page.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <TryTestingHub initialSlug={session?.slug ?? null} initialEmail={session?.email ?? null} />
  );
}
