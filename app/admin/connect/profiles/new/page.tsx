import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import AdminLogin from '../../../master/AdminLogin';
import ProfileForm from '../ProfileForm';
import '../../connect-admin.css';

export const dynamic = 'force-dynamic';

export default async function NewConnectProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;
  return <ProfileForm />;
}
