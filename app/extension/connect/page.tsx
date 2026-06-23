import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import ExtensionConnectClient from './ExtensionConnectClient';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Connect Extension · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function ExtensionConnectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return <ExtensionConnectClient loggedIn={Boolean(session)} />;
}
