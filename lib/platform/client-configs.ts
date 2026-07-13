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
  },
  cpr: {
    id: 'cpr',
    organizationId: 'cpr',
    name: 'Canadian Prospects Recruitment',
    workspaceName: 'CPR Team Portal',
    personalityId: 'athletics',
    themeId: 'cpr-theme',
    enabledModuleKeys: ['playerProfiles', 'recruiting', 'eligibility', 'events', 'documents', 'payments', 'coachNotes', 'video', 'messaging', 'calendar', 'familyPortal', 'connections', 'aiAdvisor'],
    plannedModuleKeys: [],
    terminology: { members: 'Players', startPrompt: 'What would you like to create for your players or families?', aiAdvisor: 'Recruiting Advisor' },
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
