import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import AdminLogin from '../master/AdminLogin';
import SimplifiAuditClient from './SimplifiAuditClient';

export const dynamic = 'force-dynamic';

export default async function SimplifiAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const params = await searchParams;
  const initialUrl = params.url ? decodeURIComponent(params.url) : '';

  return <SimplifiAuditClient initialUrl={initialUrl} />;
}
