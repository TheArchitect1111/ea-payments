import { redirect } from 'next/navigation';

export function redirectToAdminLogin(nextPath: string): never {
  redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
}
