import { AmandaInstallSchema } from '@/lib/portal-universal/bricks/amanda';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminActionFromRequest, requireAdminSessionFromRequest, adminAuthJsonError } from '@/lib/admin-session-guard';
import { ensureTenantFoundation } from '@/lib/tenant-foundation';
import { PORTABLE_BRICK_REGISTRY } from '@/lib/portal-universal/bricks/registry';
import { BUSINESS_OPTION_CATALOG } from '@/lib/modules/business-options';
import { listIndustryPacks } from '@/lib/portal-universal/packs';
import { createAssemblyPlan } from '@/lib/modules/assembly';

export const dynamic = 'force-dynamic';
const Manifest = z.object({
  portalSlug: z.string().regex(/^[a-z0-9-]{1,80}$/), clientName: z.string().trim().min(1).max(200),
  packagePurchased: z.string().trim().min(1), commerceOfferId: z.string().optional(),
  requestedModuleIds: z.array(z.string()).optional(), businessOptionIds: z.array(z.string()).optional(),
  industryPackId: z.string().optional(),
  bricks: z.array(z.object({ id: z.literal('amanda'), config: AmandaInstallSchema }).strict()).optional(),
}).strict();
export async function GET(req: NextRequest) {
  const auth = await requireAdminSessionFromRequest(req);
  if (!auth.ok) return adminAuthJsonError(auth);
  return NextResponse.json({ bricks: Object.values(PORTABLE_BRICK_REGISTRY).map(({ id, version, title, moduleIds }) => ({ id, version, title, moduleIds })),
    businessOptions: BUSINESS_OPTION_CATALOG.map(option => ({ ...option, assembly: createAssemblyPlan(option.moduleIds) })),
    industryPacks: listIndustryPacks().filter(pack => pack.id !== 'sample-placeholder').map(pack => ({ id: pack.id,
      title: pack.title, assembly: createAssemblyPlan(pack.suggestedModuleIds) })) });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return adminAuthJsonError(auth);
  try {
    const manifest = Manifest.parse(await req.json());
    const result = await ensureTenantFoundation({ ...manifest, assemblyMode: 'certified' });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Installation failed';
    return NextResponse.json({ ok: false, error: message }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
