import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminActionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { readBrickRecord, brickHash } from '@/lib/bricks/durable';
import { installAdmittedModules } from '@/lib/bricks/module-install';
import { MODULE_IDS, type ModuleId } from '@/lib/modules/registry';
import { provisionTestsAllowed } from '@/lib/bricks/provision-test';

const specialized = new Set(['calendar', 'people', 'discovery']);
const schema = z.object({ runId: z.string().regex(/^[a-z0-9-]{8,40}$/), moduleId: z.string() }).strict();

export async function GET() {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
export async function POST(req: NextRequest) {
  if (!provisionTestsAllowed()) return Response.json({ error: 'Not found' }, { status: 404 });
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);
  try {
    const { runId, moduleId } = schema.parse(await req.json());
    if (!MODULE_IDS.includes(moduleId as ModuleId) || specialized.has(moduleId))
      return Response.json({ error: 'Unsupported module' }, { status: 400 });
    const portalSlug = `cert-${moduleId}-${runId}`;
    const { orgId } = await ensureTenantFoundation({
      portalSlug, clientName: `Certification ${moduleId}`, packagePurchased: 'Launch Verification',
      requestedModuleIds: [moduleId], assemblyMode: 'certified',
    });
    const tenant = { organizationId: orgId, portalSlug };
    const id = 'module-install-' + moduleId + '-' + brickHash(orgId);
    const before = await readBrickRecord<typeof tenant & {moduleId: string; version: number}>(tenant, id);
    if (!before || before.moduleId !== moduleId) throw new Error('Receipt not durable');
    await installAdmittedModules(tenant, [moduleId as ModuleId]);
    const after = await readBrickRecord<typeof tenant & {moduleId: string; version: number}>(tenant, id);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Install replay changed receipt');
    const journal = await loadTenantInstall(orgId);
    if (journal?.state !== 'installed' || !journal.admitted.includes(moduleId as ModuleId)) throw new Error('Not admitted');
    return Response.json({ ok: true, testOnly: true, moduleId, tenant, receiptReplay: true,
      lifecycleCertified: false, productionTestRouteStatus: 404 });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Provision failed' },
      { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
