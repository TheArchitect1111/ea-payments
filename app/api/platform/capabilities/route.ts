import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  assembleSurfaceForModuleIds,
  getCapabilityFrameworkHealth,
  getPlatformMarketplaceEntries,
  listPlatformCapabilities,
  mapModuleIdsToCapabilityIds,
} from '@/lib/platform/capability-bootstrap';
import { MODULE_IDS, type ModuleId } from '@/lib/modules/registry';

export const dynamic = 'force-dynamic';

/**
 * EA admin Capability Marketplace API (internal).
 * GET /api/platform/capabilities
 * GET /api/platform/capabilities?view=health
 * GET /api/platform/capabilities?view=assemble&modules=documents,messaging
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') ?? 'marketplace';

  if (view === 'health') {
    return Response.json({
      ok: true,
      framework: getCapabilityFrameworkHealth(),
    });
  }

  if (view === 'catalog') {
    return Response.json({
      ok: true,
      capabilities: listPlatformCapabilities().map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        version: c.version,
        category: c.category,
        moduleId: c.moduleId,
        enableKey: c.enableKey,
        certified: c.certified,
        consumers: c.consumers,
        dependencies: c.dependencies,
        reusable: c.reusable,
        recommendedPriority: c.recommendedPriority,
      })),
    });
  }

  if (view === 'assemble') {
    const raw = searchParams.get('modules') ?? MODULE_IDS.join(',');
    const modules = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as ModuleId[];
    const surface = assembleSurfaceForModuleIds(modules);
    return Response.json({
      ok: true,
      capabilityIds: mapModuleIdsToCapabilityIds(modules),
      navigation: surface.navigation,
      routes: surface.routes,
      widgets: surface.widgets,
      aiSkills: surface.aiSkills,
      missingCapabilityIds: surface.missingCapabilityIds,
    });
  }

  // Default: marketplace entries
  return Response.json({
    ok: true,
    marketplace: getPlatformMarketplaceEntries(),
    health: getCapabilityFrameworkHealth(),
  });
}
