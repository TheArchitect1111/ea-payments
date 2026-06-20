import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getBlueprintCaptures } from '@/lib/capture-records';
import AdminLogin from '../master/AdminLogin';
import BlueprintLibraryClient from './BlueprintLibraryClient';

export const dynamic = 'force-dynamic';

export default async function BlueprintLibraryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const captures = await getBlueprintCaptures(30);

  return <BlueprintLibraryClient initialCaptures={captures} />;
}
