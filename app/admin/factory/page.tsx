import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { protocols, repoLibrary } from '@/lib/ea-factory';
import AdminLogin from '../master/AdminLogin';
import EAFactoryClient from './EAFactoryClient';

export const dynamic = 'force-dynamic';

export default async function EAFactoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  return <EAFactoryClient protocols={protocols} repos={repoLibrary} />;
}
