import { cookies } from 'next/headers';
import Link from 'next/link';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { listConnectProfiles } from '@/lib/connect-store';
import AdminLogin from '../../master/AdminLogin';
import '../connect-admin.css';
import ProfilesListClient from './ProfilesListClient';

export const dynamic = 'force-dynamic';

export default async function ConnectProfilesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return <AdminLogin />;
  const profiles = await listConnectProfiles();

  return (
    <main className="connect-admin">
      <header className="connect-admin-head">
        <div>
          <p>EA Connect Experience</p>
          <h1>Profiles</h1>
        </div>
        <div className="connect-admin-actions">
          <Link href="/admin/connect">Dashboard</Link>
          <Link href="/admin/connect/profiles/new">New Profile</Link>
        </div>
      </header>
      <ProfilesListClient profiles={profiles} />
    </main>
  );
}
