/**
 * Versioned IndustryPack schema — Phase 1.
 * @see docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md
 */
import type { ModuleId } from '@/lib/modules/registry';
import type { PlatformRole } from '@/lib/rbac';
import type { GuideLifecycleStage } from '@/lib/project-state-engine';
import type { UniversalCapabilityId } from '@/lib/portal-universal/capability-ids';

/** Semver string — validated by validateIndustryPack */
export type IndustryPackVersion = `${number}.${number}.${number}`;

export type IndustryPackId = string;

/** Mirrors PortalShell presentation — lib/chassis/PortalShell.tsx */
export type PortalPresentationMode = 'workspace' | 'experience' | 'client';

export type NavVisibility =
  | { kind: 'always' }
  | { kind: 'never' }
  | { kind: 'when_entitled' };

export type IndustryNavItem = {
  id: string;
  universalCapabilityId: UniversalCapabilityId;
  label: string;
  shortLabel?: string;
  order: number;
  visibility?: NavVisibility;
  minRole?: PlatformRole;
  stagesInclude?: GuideLifecycleStage[];
  stagesExclude?: GuideLifecycleStage[];
  hrefOverride?: string;
  preferredModuleId?: ModuleId;
  iconKey?: string;
};

export type IndustryPackBranding = {
  themeId?: string;
  personalityId?: string;
  workspaceName?: string;
  brandName?: string;
  terminology?: Partial<{
    members: string;
    home: string;
    startPrompt: string;
    focus: string;
    attention: string;
    start: string;
  }>;
  logoSrc?: string;
};

/** Extension points only — no People / Tasks / Novu / RJSF runtime in Phase 1 */
export type IndustryPackExtensions = {
  people?: { enabled: false } | { enabled: true; schemaVersion: string; notes?: string };
  tasks?: { enabled: false } | { enabled: true; schemaVersion: string; notes?: string };
  notifications?:
    | { enabled: false }
    | {
        enabled: true;
        providerHint?: 'novu' | 'ea-native';
        topicKeys?: string[];
      };
  formSchemaRefs?: Array<{
    id: string;
    universalCapabilityId: UniversalCapabilityId;
    title: string;
    schemaRef: string;
  }>;
  workflowRefs?: Array<{
    id: string;
    purpose: string;
    providerHint?: 'make' | 'trigger' | 'cron' | 'pulse';
    envKeyOrSlug?: string;
  }>;
  nba?: {
    providerId: string;
    staticHeadline?: string;
  };
};

export type IndustryPack = {
  id: IndustryPackId;
  version: IndustryPackVersion;
  title: string;
  description?: string;
  presentation: PortalPresentationMode;
  suggestedModuleIds: ModuleId[];
  hideModuleIds?: ModuleId[];
  nav: IndustryNavItem[];
  branding?: IndustryPackBranding;
  extensions?: IndustryPackExtensions;
  useClientExperienceChrome?: boolean;
  legacyPlatformClientId?: string;
};

export type ResolvedNavItem = {
  id: string;
  universalCapabilityId: UniversalCapabilityId;
  label: string;
  shortLabel?: string;
  href: string;
  moduleId?: ModuleId;
  order: number;
};
