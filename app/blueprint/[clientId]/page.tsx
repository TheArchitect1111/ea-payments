import { notFound } from 'next/navigation';
import BlueprintBrickPanel from '@/app/components/blueprint/BlueprintBrickPanel';
import { getBlueprintRecord, publicBlueprint } from '@/lib/blueprint-store';
import { canAccessBlueprint } from '@/lib/blueprint-ownership';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';

export const dynamic = 'force-dynamic';

export default async function BlueprintPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const record = await getBlueprintRecord(clientId);
  if (!record) notFound();
  const session = await requirePortalSession();
  if (!session?.email || !session.orgId) notFound();
  const membership = await findMembership(session.email, session.orgId);
  if (!canAccessBlueprint(session, record, membership)) notFound();
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '34px 20px 70px', background: '#f6f0e6', minHeight: '100vh' }}>
      <p style={{ letterSpacing: '.14em', fontSize: 12, fontWeight: 800, color: '#596b5b' }}>EFFICIENCY ARCHITECTS</p>
      <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(2.4rem,6vw,4.5rem)', margin: '8px 0' }}>Your Operational Blueprint</h1>
      <p style={{ color: '#667069', maxWidth: 700 }}>A living view of the capacity, communication, files, next actions, and experience signals you shared in your CTP conversation.</p>
      <BlueprintBrickPanel clientId={record.clientId} initialRecord={publicBlueprint(record)} />
    </main>
  );
}
