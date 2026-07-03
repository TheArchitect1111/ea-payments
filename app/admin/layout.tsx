import EANavigatorShell from './_components/EANavigatorShell';
import GuidedTour from './_components/GuidedTour';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await hasAdminPageAccess();

  if (!authenticated) {
    return <>{children}</>;
  }

  return (
    <EANavigatorShell>
      <GuidedTour autoStart />
      {children}
    </EANavigatorShell>
  );
}
