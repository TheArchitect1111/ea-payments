import GuidedTour from './_components/GuidedTour';
import AdminWorkspaceShell from './_components/AdminWorkspaceShell';
import EAAssistant from '@/app/components/ea-assistant/EAAssistant';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await hasAdminPageAccess();

  if (!authenticated) {
    return <>{children}</>;
  }

  return (
    <AdminWorkspaceShell>
      <GuidedTour autoStart />
      {children}
      <EAAssistant surface="admin" />
    </AdminWorkspaceShell>
  );
}
