import {
  getModuleDefinition,
  moduleHref,
  type ModuleId,
} from '@/lib/modules/registry';
import { normalizeRole, roleAtLeast, type PlatformRole } from '@/lib/rbac';
import type { GuideLifecycleStage } from '@/lib/project-state-engine';
import {
  UNIVERSAL_TO_MODULES,
  type UniversalCapabilityId,
} from '@/lib/portal-universal/capability-ids';
import type {
  IndustryPack,
  ResolvedNavItem,
} from '@/lib/portal-universal/industry-pack';
import {
  portalActiveTabForModule,
  portalNavIconForModule,
  type PortalNavIconName,
} from '@/lib/chassis/portal-nav-mapping';
import type { PortalSidebarNavGroup } from '@/lib/modules/portal-modules';

export type ResolveIndustryNavInput = {
  slug: string;
  pack: IndustryPack;
  /** Entitled module ids after RBAC + entitlements (from resolvePortalModuleAccess) */
  enabledModuleIds: ReadonlySet<ModuleId>;
  role: PlatformRole;
  guideStage?: GuideLifecycleStage;
};

function interpolateHref(template: string, slug: string): string {
  return template.replaceAll('{slug}', slug.trim());
}

function moduleCandidates(
  universalCapabilityId: UniversalCapabilityId,
  preferredModuleId?: ModuleId,
): ModuleId[] {
  const mapped = UNIVERSAL_TO_MODULES[universalCapabilityId] || [];
  const out: ModuleId[] = [];
  if (preferredModuleId) out.push(preferredModuleId);
  for (const id of mapped) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Resolve pack nav → visible items.
 * Never bypasses entitlements: items require at least one entitled mapped module
 * (unless visibility is never, in which case they are dropped).
 */
export function resolveIndustryNav(input: ResolveIndustryNavInput): ResolvedNavItem[] {
  const role = normalizeRole(input.role);
  const hide = new Set(input.pack.hideModuleIds || []);
  const items = [...input.pack.nav].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });

  const resolved: ResolvedNavItem[] = [];

  for (const item of items) {
    const visibility = item.visibility?.kind || 'when_entitled';
    if (visibility === 'never') continue;

    if (item.minRole && !roleAtLeast(role, item.minRole)) continue;

    if (input.guideStage) {
      if (item.stagesInclude?.length && !item.stagesInclude.includes(input.guideStage)) {
        continue;
      }
      if (item.stagesExclude?.length && item.stagesExclude.includes(input.guideStage)) {
        continue;
      }
    }

    const candidates = moduleCandidates(
      item.universalCapabilityId,
      item.preferredModuleId,
    ).filter((id) => input.enabledModuleIds.has(id) && !hide.has(id));

    // Security: always require an entitled module (always ≡ when_entitled for Phase 1)
    if (candidates.length === 0) continue;

    const moduleId = candidates[0];
    const modDef = getModuleDefinition(moduleId);
    if (!modDef) continue;

    // Module requiredRole already applied via enabled set from resolvePortalModuleAccess,
    // but double-check for safety.
    if (!roleAtLeast(role, modDef.requiredRole)) continue;

    let href: string;
    if (item.hrefOverride?.trim()) {
      href = interpolateHref(item.hrefOverride.trim(), input.slug);
    } else {
      href = moduleHref(input.slug, modDef);
    }

    resolved.push({
      id: item.id,
      universalCapabilityId: item.universalCapabilityId,
      label: item.label,
      shortLabel: item.shortLabel,
      href,
      moduleId,
      order: item.order,
    });
  }

  return resolved;
}

/** Map resolved pack nav into PortalShell sidebar groups (single core group). */
export function resolvedNavToSidebarGroups(
  items: ResolvedNavItem[],
): PortalSidebarNavGroup[] {
  if (!items.length) return [];
  return [
    {
      id: 'core',
      label: 'Workspace',
      items: items.map((item) => {
        const moduleId = (item.moduleId || 'dashboard') as ModuleId;
        return {
          moduleId,
          label: item.label,
          href: item.href,
          icon: portalNavIconForModule(moduleId) as PortalNavIconName,
          activeTab: String(portalActiveTabForModule(moduleId)),
        };
      }),
    },
  ];
}
