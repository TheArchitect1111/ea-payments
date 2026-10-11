import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminActionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { listEntitlementsForOrg, activeModuleIdsFromEntitlements } from '@/lib/entitlements';
import { installAdmittedModules } from './module-install';
import { listCalendarEvents, saveCalendarEvent } from '@/lib/calendar/storage';
import { handleDiscoverySubmit } from '@/lib/discovery/storage';
import { ensurePersonForClientRecordAsync } from '@/lib/people/ensure-person';
import { getPeopleRepository } from '@/lib/people/adapter';
export type ProvisionModule = 'calendar' | 'people' | 'discovery';
export function provisionTestsAllowed() {
  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.VERCEL_ENV === 'preview') return true;
  return !process.env.VERCEL_ENV && process.env.NODE_ENV === 'test';
}
export function provisionTestGET() {
  return Response.json({ error: provisionTestsAllowed() ? 'Use POST with admin authorization.' : 'Not found' }, { status: provisionTestsAllowed() ? 405 : 404 });
}
export async function runProvisionTest(req: NextRequest, moduleId: ProvisionModule) {
  if (!provisionTestsAllowed()) return Response.json({ error: 'Not found' }, { status: 404 });
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);
  try {
    const { runId } = z.object({ runId: z.string().regex(/^[a-z0-9-]{8,40}$/) }).strict().parse(await req.json());
    const portalSlug = `cert-${moduleId}-${runId}`;
    const result = await ensureTenantFoundation({ portalSlug, clientName: `Certification ${moduleId}`, packagePurchased: 'Launch Verification', requestedModuleIds: [moduleId], assemblyMode: 'certified' });
    const tenant = { organizationId: result.orgId, portalSlug };
    // Install replay must preserve the mapping and data.
    await installAdmittedModules(tenant, [moduleId]);
    let lifecycle: Record<string, unknown>;
    if (moduleId === 'calendar') {
      const event = { id: 'cert-event', title: 'Certification event', start: '2030-01-01T10:00:00.000Z', end: '2030-01-01T11:00:00.000Z', allDay: false };
      await saveCalendarEvent(tenant, event); await saveCalendarEvent(tenant, { ...event, title: 'Verified certification event' });
      const events = await listCalendarEvents(tenant, new Date('2030-01-01'), new Date('2030-01-02'));
      if (events.length !== 1 || events[0].id !== event.id || events[0].title !== 'Verified certification event') throw new Error('Calendar replay verification failed');
      lifecycle = { provider: 'internal', recordId: events[0].id, rows: 1, updatedSameRecord: true };
    } else if (moduleId === 'people') {
      const person = { ...tenant, email: `${runId}@certification.invalid`, displayName: 'Certification contact', source: 'provisioning' as const };
      const first = await ensurePersonForClientRecordAsync(person); const second = await ensurePersonForClientRecordAsync(person);
      const rows = await getPeopleRepository().listPersonsByOrg(tenant.organizationId);
      if (!first || first.id !== second?.id || rows.filter(x => x.id === first.id).length !== 1) throw new Error('People identity replay verification failed');
      lifecycle = { provider: 'postgres', recordId: first.id, rows: 1, sameRecord: true, tracking: 'append-only People audit' };
    } else {
      const input = { requestId: runId, name: 'Certification contact', teamSize: 2, revenueRange: 'under_100k', systemsCount: 2, operationalChallenges: ['manual_scheduling'], complexity: 'low' };
      const confirmations: unknown[] = [];
      const confirm = async (message: unknown) => { confirmations.push(message); return { ok: true }; };
      const first = await handleDiscoverySubmit(tenant, `${runId}@certification.invalid`, input, confirm);
      const second = await handleDiscoverySubmit(tenant, `${runId}@certification.invalid`, input, confirm);
      if (first.id !== second.id || !second.confirmationSent || confirmations.length > 1) throw new Error('Discovery replay verification failed');
      lifecycle = { provider: 'airtable', recordId: first.id, sameRecord: true, confirmation: 'captured test delivery, no external email', confirmationsThisRun: confirmations.length };
    }
    const installed = await loadTenantInstall(result.orgId);
    const actual = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(result.orgId));
    if (installed?.state !== 'installed' || JSON.stringify([...actual].sort()) !== JSON.stringify([...installed.admitted].sort())) throw new Error('Admitted entitlement/install mismatch');
    return Response.json({ ok: true, testOnly: true, tenant, admitted: installed.admitted, persisted: [...actual], lifecycle, productionTestRouteStatus: 404 });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Provisioning test failed' }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
