import { MODULE_IDS, type ModuleId } from '@/lib/modules/registry';
import { PLATFORM_ROLES, type PlatformRole } from '@/lib/rbac';
import { GUIDE_LIFECYCLE_STAGES, type GuideLifecycleStage } from '@/lib/project-state-engine';
import {
  isUniversalCapabilityId,
  type UniversalCapabilityId,
} from '@/lib/portal-universal/capability-ids';
import type {
  IndustryNavItem,
  IndustryPack,
  IndustryPackExtensions,
  IndustryPackVersion,
  NavVisibility,
  PortalPresentationMode,
} from '@/lib/portal-universal/industry-pack';

export type ValidateIndustryPackResult =
  | { ok: true; pack: IndustryPack; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const PACK_ID_RE = /^[a-z][a-z0-9-]*$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function isModuleId(value: string): value is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(value);
}

function isPlatformRole(value: string): value is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(value);
}

function isGuideStage(value: string): value is GuideLifecycleStage {
  return (GUIDE_LIFECYCLE_STAGES as readonly string[]).includes(value);
}

function isPresentation(value: string): value is PortalPresentationMode {
  return value === 'workspace' || value === 'experience' || value === 'client';
}

function validateVisibility(raw: unknown, path: string, errors: string[]): NavVisibility | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(`${path} must be an object`);
    return undefined;
  }
  const kind = (raw as { kind?: string }).kind;
  if (kind !== 'always' && kind !== 'never' && kind !== 'when_entitled') {
    errors.push(`${path}.kind must be always|never|when_entitled`);
    return undefined;
  }
  return { kind };
}

function validateNavItem(raw: unknown, index: number, errors: string[]): IndustryNavItem | null {
  if (!raw || typeof raw !== 'object') {
    errors.push(`nav[${index}] must be an object`);
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  if (!id) errors.push(`nav[${index}].id is required`);

  const universalCapabilityId =
    typeof row.universalCapabilityId === 'string' ? row.universalCapabilityId.trim() : '';
  if (!isUniversalCapabilityId(universalCapabilityId)) {
    errors.push(`nav[${index}].universalCapabilityId is invalid`);
  }

  const label = typeof row.label === 'string' ? row.label.trim() : '';
  if (!label) errors.push(`nav[${index}].label is required`);

  const order = typeof row.order === 'number' && Number.isFinite(row.order) ? row.order : NaN;
  if (Number.isNaN(order)) errors.push(`nav[${index}].order must be a number`);

  const visibility = validateVisibility(row.visibility, `nav[${index}].visibility`, errors);

  let minRole: PlatformRole | undefined;
  if (row.minRole != null) {
    if (typeof row.minRole !== 'string' || !isPlatformRole(row.minRole)) {
      errors.push(`nav[${index}].minRole is invalid`);
    } else {
      minRole = row.minRole;
    }
  }

  const stagesInclude: GuideLifecycleStage[] = [];
  if (row.stagesInclude != null) {
    if (!Array.isArray(row.stagesInclude)) {
      errors.push(`nav[${index}].stagesInclude must be an array`);
    } else {
      for (const stage of row.stagesInclude) {
        if (typeof stage !== 'string' || !isGuideStage(stage)) {
          errors.push(`nav[${index}].stagesInclude contains invalid stage`);
        } else {
          stagesInclude.push(stage);
        }
      }
    }
  }

  const stagesExclude: GuideLifecycleStage[] = [];
  if (row.stagesExclude != null) {
    if (!Array.isArray(row.stagesExclude)) {
      errors.push(`nav[${index}].stagesExclude must be an array`);
    } else {
      for (const stage of row.stagesExclude) {
        if (typeof stage !== 'string' || !isGuideStage(stage)) {
          errors.push(`nav[${index}].stagesExclude contains invalid stage`);
        } else {
          stagesExclude.push(stage);
        }
      }
    }
  }

  let preferredModuleId: ModuleId | undefined;
  if (row.preferredModuleId != null) {
    if (typeof row.preferredModuleId !== 'string' || !isModuleId(row.preferredModuleId)) {
      errors.push(`nav[${index}].preferredModuleId is invalid`);
    } else {
      preferredModuleId = row.preferredModuleId;
    }
  }

  if (errors.some((e) => e.startsWith(`nav[${index}]`))) {
    return null;
  }

  return {
    id,
    universalCapabilityId: universalCapabilityId as UniversalCapabilityId,
    label,
    shortLabel: typeof row.shortLabel === 'string' ? row.shortLabel.trim() : undefined,
    order,
    visibility,
    minRole,
    stagesInclude: stagesInclude.length ? stagesInclude : undefined,
    stagesExclude: stagesExclude.length ? stagesExclude : undefined,
    hrefOverride: typeof row.hrefOverride === 'string' ? row.hrefOverride.trim() : undefined,
    preferredModuleId,
    iconKey: typeof row.iconKey === 'string' ? row.iconKey.trim() : undefined,
  };
}

function validateExtensions(
  raw: unknown,
  errors: string[],
  phase1Strict: boolean,
): IndustryPackExtensions | undefined {
  if (raw == null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push('extensions must be an object');
    return undefined;
  }
  const ext = raw as Record<string, unknown>;
  const out: IndustryPackExtensions = {};

  for (const key of ['people', 'tasks'] as const) {
    const block = ext[key];
    if (block == null) continue;
    if (typeof block !== 'object' || Array.isArray(block)) {
      errors.push(`extensions.${key} must be an object`);
      continue;
    }
    const enabled = (block as { enabled?: boolean }).enabled;
    if (enabled === true) {
      if (phase1Strict) {
        errors.push(`extensions.${key}.enabled must be false in Phase 1 shipped packs`);
      }
      const schemaVersion = String((block as { schemaVersion?: string }).schemaVersion || '').trim();
      if (!schemaVersion) errors.push(`extensions.${key}.schemaVersion required when enabled`);
      out[key] = { enabled: true, schemaVersion, notes: (block as { notes?: string }).notes };
    } else {
      out[key] = { enabled: false };
    }
  }

  if (ext.notifications != null) {
    const n = ext.notifications as { enabled?: boolean };
    if (n.enabled === true && phase1Strict) {
      // Allow schema for future, but Phase 1 in-repo packs should keep false —
      // sample may only use enabled:false. If enabled:true, error under strict.
      errors.push('extensions.notifications.enabled must be false in Phase 1 shipped packs');
    }
    out.notifications =
      n.enabled === true
        ? {
            enabled: true,
            providerHint: (ext.notifications as { providerHint?: 'novu' | 'ea-native' }).providerHint,
            topicKeys: (ext.notifications as { topicKeys?: string[] }).topicKeys,
          }
        : { enabled: false };
  }

  if (ext.formSchemaRefs != null) {
    if (!Array.isArray(ext.formSchemaRefs)) {
      errors.push('extensions.formSchemaRefs must be an array');
    } else {
      out.formSchemaRefs = [];
      ext.formSchemaRefs.forEach((ref, i) => {
        if (!ref || typeof ref !== 'object') {
          errors.push(`extensions.formSchemaRefs[${i}] must be an object`);
          return;
        }
        const r = ref as Record<string, unknown>;
        const id = typeof r.id === 'string' ? r.id.trim() : '';
        const title = typeof r.title === 'string' ? r.title.trim() : '';
        const schemaRef = typeof r.schemaRef === 'string' ? r.schemaRef.trim() : '';
        const uc =
          typeof r.universalCapabilityId === 'string' ? r.universalCapabilityId.trim() : '';
        if (!id) errors.push(`extensions.formSchemaRefs[${i}].id is required`);
        if (!title) errors.push(`extensions.formSchemaRefs[${i}].title is required`);
        if (!schemaRef) errors.push(`extensions.formSchemaRefs[${i}].schemaRef is required`);
        if (!isUniversalCapabilityId(uc)) {
          errors.push(`extensions.formSchemaRefs[${i}].universalCapabilityId is invalid`);
        }
        if (id && title && schemaRef && isUniversalCapabilityId(uc)) {
          out.formSchemaRefs!.push({
            id,
            title,
            schemaRef,
            universalCapabilityId: uc,
          });
        }
      });
    }
  }

  if (ext.workflowRefs != null) {
    if (!Array.isArray(ext.workflowRefs)) {
      errors.push('extensions.workflowRefs must be an array');
    } else {
      out.workflowRefs = [];
      ext.workflowRefs.forEach((ref, i) => {
        if (!ref || typeof ref !== 'object') {
          errors.push(`extensions.workflowRefs[${i}] must be an object`);
          return;
        }
        const r = ref as Record<string, unknown>;
        const id = typeof r.id === 'string' ? r.id.trim() : '';
        const purpose = typeof r.purpose === 'string' ? r.purpose.trim() : '';
        if (!id) errors.push(`extensions.workflowRefs[${i}].id is required`);
        if (!purpose) errors.push(`extensions.workflowRefs[${i}].purpose is required`);
        if (id && purpose) {
          out.workflowRefs!.push({
            id,
            purpose,
            providerHint:
              r.providerHint === 'make' ||
              r.providerHint === 'trigger' ||
              r.providerHint === 'cron' ||
              r.providerHint === 'pulse'
                ? r.providerHint
                : undefined,
            envKeyOrSlug: typeof r.envKeyOrSlug === 'string' ? r.envKeyOrSlug : undefined,
          });
        }
      });
    }
  }

  if (ext.nba != null) {
    if (typeof ext.nba !== 'object' || Array.isArray(ext.nba)) {
      errors.push('extensions.nba must be an object');
    } else {
      const providerId = String((ext.nba as { providerId?: string }).providerId || '').trim();
      if (!providerId) errors.push('extensions.nba.providerId is required');
      else {
        out.nba = {
          providerId,
          staticHeadline: (ext.nba as { staticHeadline?: string }).staticHeadline,
        };
      }
    }
  }

  return out;
}

/**
 * Validate an IndustryPack. phase1Strict=true rejects enabled people/tasks/notifications.
 */
export function validateIndustryPack(
  raw: unknown,
  opts?: { phase1Strict?: boolean },
): ValidateIndustryPackResult {
  const phase1Strict = opts?.phase1Strict !== false;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['pack must be an object'], warnings };
  }

  const input = raw as Record<string, unknown>;
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  if (!id || !PACK_ID_RE.test(id)) {
    errors.push('id must be kebab-case starting with a letter');
  }

  const versionRaw = typeof input.version === 'string' ? input.version.trim() : '';
  if (!SEMVER_RE.test(versionRaw)) {
    errors.push('version must be semver X.Y.Z');
  }

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) errors.push('title is required');

  const presentation =
    typeof input.presentation === 'string' ? input.presentation.trim() : '';
  if (!isPresentation(presentation)) {
    errors.push('presentation must be workspace|experience|client');
  }

  const suggestedModuleIds: ModuleId[] = [];
  if (!Array.isArray(input.suggestedModuleIds)) {
    errors.push('suggestedModuleIds must be an array');
  } else {
    for (const mid of input.suggestedModuleIds) {
      if (typeof mid !== 'string' || !isModuleId(mid)) {
        errors.push(`suggestedModuleIds contains invalid module: ${String(mid)}`);
      } else {
        suggestedModuleIds.push(mid);
      }
    }
  }

  const hideModuleIds: ModuleId[] = [];
  if (input.hideModuleIds != null) {
    if (!Array.isArray(input.hideModuleIds)) {
      errors.push('hideModuleIds must be an array');
    } else {
      for (const mid of input.hideModuleIds) {
        if (typeof mid !== 'string' || !isModuleId(mid)) {
          errors.push(`hideModuleIds contains invalid module: ${String(mid)}`);
        } else {
          hideModuleIds.push(mid);
        }
      }
    }
  }

  if (!Array.isArray(input.nav) || input.nav.length === 0) {
    errors.push('nav must be a non-empty array');
  }

  const nav: IndustryNavItem[] = [];
  const seenIds = new Set<string>();
  const orderCounts = new Map<number, number>();
  if (Array.isArray(input.nav)) {
    input.nav.forEach((item, index) => {
      const before = errors.length;
      const parsed = validateNavItem(item, index, errors);
      if (!parsed || errors.length > before) return;
      if (seenIds.has(parsed.id)) {
        errors.push(`duplicate nav id: ${parsed.id}`);
        return;
      }
      seenIds.add(parsed.id);
      orderCounts.set(parsed.order, (orderCounts.get(parsed.order) || 0) + 1);
      nav.push(parsed);
    });
  }
  for (const [order, count] of orderCounts) {
    if (count > 1) warnings.push(`duplicate nav order ${order} (stable-sorted by id)`);
  }

  const useClientExperienceChrome = Boolean(input.useClientExperienceChrome);
  if (presentation === 'client' && !useClientExperienceChrome) {
    warnings.push('presentation is client but useClientExperienceChrome is not true');
  }

  const extensions = validateExtensions(input.extensions, errors, phase1Strict);

  let branding: IndustryPack['branding'];
  if (input.branding != null) {
    if (typeof input.branding !== 'object' || Array.isArray(input.branding)) {
      errors.push('branding must be an object');
    } else {
      branding = input.branding as IndustryPack['branding'];
    }
  }

  if (errors.length) {
    return { ok: false, errors, warnings };
  }

  const pack: IndustryPack = {
    id,
    version: versionRaw as IndustryPackVersion,
    title,
    description: typeof input.description === 'string' ? input.description : undefined,
    presentation: presentation as PortalPresentationMode,
    suggestedModuleIds,
    hideModuleIds: hideModuleIds.length ? hideModuleIds : undefined,
    nav,
    branding,
    extensions,
    useClientExperienceChrome: useClientExperienceChrome || undefined,
    legacyPlatformClientId:
      typeof input.legacyPlatformClientId === 'string'
        ? input.legacyPlatformClientId.trim()
        : undefined,
  };

  return { ok: true, pack, warnings };
}

export function assertValidIndustryPack(
  raw: unknown,
  opts?: { phase1Strict?: boolean },
): IndustryPack {
  const result = validateIndustryPack(raw, opts);
  if (!result.ok) {
    throw new Error(`Invalid IndustryPack: ${result.errors.join('; ')}`);
  }
  return result.pack;
}
