import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, parseAdminSession, verifyAdminSession, type AdminSessionUser } from './ea-admin-auth';

export async function hasAdminPageAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

export async function getAdminPageUser(): Promise<AdminSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  return parseAdminSession(token);
}
