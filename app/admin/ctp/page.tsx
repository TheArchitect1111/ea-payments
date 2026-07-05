import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { buildCtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import { listCtpSubmissions } from '@/lib/ctp-submissions';
import CtpSubmissionsClient from './CtpSubmissionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminCtpPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/admin/ctp');
  }

  const submissions = await listCtpSubmissions(200);
  const views = submissions.map(buildCtpAdminSubmissionView);

  return <CtpSubmissionsClient initialSubmissions={views} />;
}
