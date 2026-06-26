import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { getConnectProfileById } from '@/lib/connect-store';
import AdminLogin from '../../../master/AdminLogin';
import ProfileForm from '../ProfileForm';
import '../../connect-admin.css';

export const dynamic = 'force-dynamic';

export default async function EditConnectProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;
  const { id } = await params;
  const profile = await getConnectProfileById(id);
  if (!profile) notFound();
  return <ProfileForm profile={profile} />;
}
