import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { CREAM } from '@/lib/design-system';
import { getLegalExecutiveDashboard } from '@/lib/trust-engine/api';
import { getLegalAuditHistory } from '@/lib/trust-engine/audit';
import { buildClientLegalStatus } from '@/lib/trust-engine/status';
import { LegalExecutiveDashboard } from './LegalExecutiveDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminLegalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  const session = token ? verifyAdminSession(token) : null;
  if (!session) redirectToAdminLogin('/admin/legal');

  const dash = await getLegalExecutiveDashboard();
  const audit = await getLegalAuditHistory({ limit: 40 });
  const statusByClient: Record<string, ReturnType<typeof buildClientLegalStatus>['documents']> = {};
  for (const c of dash.clients) {
    statusByClient[c.clientId] = buildClientLegalStatus({
      productId: c.productId,
      profile: c,
    }).documents;
  }

  return (
    <main style={{ background: '#faf8f4', minHeight: '100vh' }}>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8" style={{ background: CREAM }}>
        <LegalExecutiveDashboard
          metrics={dash.metrics}
          clients={dash.clients}
          recentAcceptances={dash.recentAcceptances}
          requiringReacceptance={dash.requiringReacceptance}
          upcomingReleases={dash.upcomingReleases}
          initialAudit={audit}
          statusByClient={statusByClient}
        />
      </div>
    </main>
  );
}
