/**
 * Client application configs — apps as configuration.
 */
import {
  enableKeysToCapabilityIds,
  type ClientCapabilityConfig,
} from '@ea/capability-registry';
import {
  assembleFromEnableKeys,
  type AssembledSurface,
} from '@ea/module-engine';
import {
  getWorkspacePersonality,
  normalizeWorkspacePersonality,
  buildAiContextEnvelope,
  type WorkspacePersonality,
} from '@ea/personality-engine';
import {
  getWorkspaceTheme,
  normalizeWorkspaceTheme,
  workspaceThemeToCssVars,
  type WorkspaceTheme,
} from '@ea/theme-engine';
import { getPlatformCapabilityRegistry } from './capability-bootstrap';

/** Optional marketing landing overrides on the same ClientConfig that drives the portal. */
export type PlatformClientLandingConfig = {
  /** Page id used in WebsitePageManifest (defaults to `{clientId}-home`). */
  pageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  heroHeadline?: string;
  heroLede?: string;
  ctaLabel?: string;
  /** Disable chassis section ids from the default landing template. */
  disabledSectionIds?: string[];
};

export type PlatformClientConfig = {
  id: string;
  organizationId: string;
  name: string;
  workspaceName: string;
  personalityId: string;
  themeId: string;
  enabledModuleKeys: string[];
  plannedModuleKeys: string[];
  terminology: Record<string, string>;
  /** Landing / website surface — same config envelope as the portal. */
  landing?: PlatformClientLandingConfig;
};

export const PLATFORM_CLIENT_CONFIGS: Record<string, PlatformClientConfig> = {
  ea: {
    id: 'ea',
    organizationId: 'ea',
    name: 'Efficiency Architects',
    workspaceName: 'EA Command Center',
    personalityId: 'executive',
    themeId: 'ea-default-theme',
    enabledModuleKeys: ['clients', 'pulse', 'training', 'updateHub', 'amplifi', 'magnifi', 'growthPortal', 'connections'],
    plannedModuleKeys: [],
    terminology: { members: 'Clients', startPrompt: 'What would you like to build today?' },
    landing: {
      heroHeadline: 'Build the operating system your clients feel.',
      heroLede: 'Portals, landings, and entitlements from one client configuration.',
      ctaLabel: 'Start building',
      seoTitle: 'Efficiency Architects — Platform',
      seoDescription: 'Reproduce branded portals and landings from a single ClientConfig.',
    },
  },
  cpr: {
    id: 'cpr',
    organizationId: 'cpr',
    name: 'Canadian Prospects Recruitment',
    workspaceName: 'CPR Team Portal',
    personalityId: 'athletics',
    themeId: 'cpr-theme',
    enabledModuleKeys: [
      'playerProfiles',
      'recruiting',
      'eligibility',
      'events',
      'documents',
      'payments',
      'coachNotes',
      'video',
      'messaging',
      'calendar',
      'familyPortal',
      'connections',
      'aiAdvisor',
      'training',
      'updateHub',
    ],
    plannedModuleKeys: [],
    terminology: { members: 'Players', startPrompt: 'What would you like to create for your players or families?', aiAdvisor: 'Recruiting Advisor' },
    landing: {
      heroHeadline: 'Every prospect. Every family. One recruiting home.',
      heroLede:
        'Canadian Prospects helps athletes get seen — and helps parents understand the next right step after camp, showcase, or tryout.',
      ctaLabel: 'Get the Parent Recruiting Guide',
      seoTitle: 'Canadian Prospects Recruitment | Faith. Family. Basketball. Future.',
      seoDescription:
        'Camps, showcases, eligibility, film, and family communication — CPR athletics pack on the EA chassis.',
    },
  },
  etfm: {
    id: 'etfm',
    organizationId: 'etfm',
    name: 'ETFM',
    workspaceName: 'ETFM Coaching Portal',
    personalityId: 'financial-coaching',
    themeId: 'etfm-theme',
    enabledModuleKeys: ['training', 'updateHub', 'connections'],
    plannedModuleKeys: ['financialBlueprint'],
    terminology: { members: 'Clients', startPrompt: 'What client outcome would you like to support?' },
    landing: {
      heroHeadline: 'Coaching that clarifies the next financial move.',
      heroLede: 'Assessments, action plans, and progress in one coaching portal.',
      ctaLabel: 'Enter coaching portal',
      seoTitle: 'ETFM Coaching',
      seoDescription: 'Financial coaching portal and landing — ETFM pack on the EA chassis.',
    },
  },
  '3hc': {
    id: '3hc',
    organizationId: '3hc',
    name: '3HC',
    workspaceName: '3HC Readiness Center',
    personalityId: 'compliance',
    themeId: '3hc-theme',
    enabledModuleKeys: ['training', 'updateHub', 'connections'],
    plannedModuleKeys: ['evidenceLibrary'],
    terminology: { members: 'Staff', startPrompt: 'What compliance process would you like to improve?' },
    landing: {
      heroHeadline: 'Readiness you can demonstrate.',
      heroLede: 'Training, evidence, and staff workflows — 3HC readiness pack.',
      ctaLabel: 'Enter readiness center',
      seoTitle: '3HC Readiness Center',
      seoDescription: 'Compliance readiness portal and landing on the EA chassis.',
    },
  },
  'bob-rumball': {
    id: 'bob-rumball',
    organizationId: 'bob-rumball',
    name: 'Bob Rumball',
    workspaceName: 'Bob Rumball Learning Workspace',
    personalityId: 'training-learning',
    themeId: 'bob-rumball-theme',
    enabledModuleKeys: ['training', 'updateHub', 'connections'],
    plannedModuleKeys: ['evidenceLibrary'],
    terminology: { members: 'Learners', startPrompt: 'What learning or accessibility outcome would you like to support?' },
    landing: {
      heroHeadline: 'Learning that meets every learner where they are.',
      heroLede: 'Accessible training workspace and landing — Bob Rumball learning pack.',
      ctaLabel: 'Start learning',
      seoTitle: 'Bob Rumball Learning',
      seoDescription: 'Accessible learning portal and landing on the EA chassis.',
    },
  },
};

export type AssembledClientApplication = {
  client: PlatformClientConfig;
  theme: WorkspaceTheme;
  cssVars: Record<string, string>;
  personality: WorkspacePersonality;
  terminology: Record<string, string>;
  capabilityIds: string[];
  plannedCapabilityIds: string[];
  surface: AssembledSurface;
  aiContext: string;
  capabilityConfig: ClientCapabilityConfig;
};

export function listPlatformClients(): PlatformClientConfig[] {
  return Object.values(PLATFORM_CLIENT_CONFIGS);
}

export function getPlatformClientConfig(id: string): PlatformClientConfig | undefined {
  return PLATFORM_CLIENT_CONFIGS[id];
}

export function assembleClientApplication(clientId: string): AssembledClientApplication | null {
  const client = getPlatformClientConfig(clientId);
  if (!client) return null;

  const theme = normalizeWorkspaceTheme(getWorkspaceTheme(client.themeId));
  const personality = normalizeWorkspacePersonality(getWorkspacePersonality(client.personalityId));
  const capabilityIds = enableKeysToCapabilityIds(client.enabledModuleKeys);
  const plannedCapabilityIds = enableKeysToCapabilityIds(client.plannedModuleKeys);
  const registry = getPlatformCapabilityRegistry();
  const surface = assembleFromEnableKeys(client.enabledModuleKeys, {
    registry,
    organizationId: client.organizationId,
  });
  const terminology = { ...personality.terminology, ...client.terminology };
  const aiContext = buildAiContextEnvelope(
    client.personalityId,
    surface.aiSkills.map((s) => s.description),
  );

  return {
    client,
    theme,
    cssVars: workspaceThemeToCssVars(theme),
    personality,
    terminology,
    capabilityIds,
    plannedCapabilityIds,
    surface,
    aiContext,
    capabilityConfig: {
      organizationId: client.organizationId,
      name: client.name,
      workspaceName: client.workspaceName,
      themeId: client.themeId,
      personalityId: client.personalityId,
      enabledCapabilities: capabilityIds,
      plannedCapabilities: plannedCapabilityIds,
      terminology,
      aiProfile: client.personalityId,
    },
  };
}
