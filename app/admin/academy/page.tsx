import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import AdminLogin from '../master/AdminLogin';
import AcademyClient from './AcademyClient';

export const dynamic = 'force-dynamic';

export default async function AcademyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  return <AcademyClient />;
}
