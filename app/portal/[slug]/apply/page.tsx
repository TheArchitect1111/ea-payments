import { cookies } from 'next/headers';
import { getClientByPortalSlug } from '@/lib/airtable';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { NAVY, GOLD } from '@/lib/design-system';
import PortalFormClient from '@/app/portal/[slug]/intake/IntakeFormClient';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClientByPortalSlug(slug);
  const orgName = client?.organization || client?.clientName || 'this organization';

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: '#fff', padding: '48px 24px' }}>
      <main style={{ maxWidth: 560, margin: '0 auto' }}>
        <p style={{ color: GOLD, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Application
        </p>
        <h1 style={{ fontSize: 28, margin: '8px 0 12px' }}>Apply to {orgName}</h1>
        <p style={{ opacity: 0.85, marginBottom: 24 }}>
          Submit your application — no account required. Track status later from the portal when
          invited.
        </p>
        <PortalFormClient
          slug={slug}
          kind="application"
          title="Your application"
          submitLabel="Submit application"
        />
        {session?.slug === slug ? (
          <p style={{ marginTop: 24, fontSize: 14, opacity: 0.8 }}>
            <a href={`/portal/${slug}/applications`} style={{ color: GOLD }}>
              View my applications →
            </a>
          </p>
        ) : null}
      </main>
    </div>
  );
}
