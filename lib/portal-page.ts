import type { ModuleId } from '@/lib/modules/registry';
import { requirePortalModule } from '@/lib/modules/portal-modules';

/** Standard portal page gate — auth, slug match, module entitlement, client record. */
export async function loadPortalModule(slug: string, moduleId: ModuleId) {
  return requirePortalModule(slug, moduleId);
}

export { requirePortalModule };
