import { redirect } from 'next/navigation';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import AmandaLettersEditor from '@/components/amanda/AmandaLettersEditor';

export const dynamic = 'force-dynamic';

export default async function AmandaLettersPage() {
  const { session } = await requirePortalModule('amanda-catherine', 'dashboard');
  if (!roleAtLeast(normalizeRole(session.role), 'admin')) redirect('/portal/login');
  return <main className="mx-auto max-w-4xl px-5 py-10"><AmandaLettersEditor /></main>;
}
