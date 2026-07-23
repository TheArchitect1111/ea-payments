import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import AdminLogin from '../../master/AdminLogin';
import QuickLaunchClient from './QuickLaunchClient';

export default async function QuickLaunchPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;

  return <QuickLaunchClient />;
}
