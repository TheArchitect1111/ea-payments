import type { ClientCapabilityConfig } from '@ea/capability-registry';
import {
  assembleFromCapabilityIds,
  type CapabilityRegistry,
  getDefaultRegistry,
} from '@ea/module-engine';
import {
  buildAiContextEnvelope,
  getWorkspacePersonality,
  normalizeWorkspacePersonality,
} from '@ea/personality-engine';
import {
  getWorkspaceTheme,
  normalizeWorkspaceTheme,
  workspaceThemeToCssVars,
} from '@ea/theme-engine';
import type { WorkspaceAssembleInput, WorkspaceShell } from './types';

export type WorkspaceAssembleOptions = {
  registry?: CapabilityRegistry;
  strict?: boolean;
};

/**
 * Assemble a workspace shell from configuration.
 * Engines host capabilities ? this function never embeds client domain logic.
 */
export function assembleWorkspaceShell(
  input: WorkspaceAssembleInput,
  options: WorkspaceAssembleOptions = {},
): WorkspaceShell {
  const registry = options.registry ?? getDefaultRegistry();
  const theme = normalizeWorkspaceTheme({
    ...getWorkspaceTheme(input.themeId ?? input.organizationId),
    ...(input.theme ?? {}),
    organizationId: input.organizationId,
  });

  const personality = normalizeWorkspacePersonality({
    ...getWorkspacePersonality(input.personalityId ?? 'executive'),
    ...(input.personality ?? {}),
    id: input.personalityId ?? input.personality?.id ?? 'executive',
  });

  const surface = assembleFromCapabilityIds(input.enabledCapabilityIds, {
    registry,
    organizationId: input.organizationId,
    strict: options.strict,
  });

  const terminology = {
    ...personality.terminology,
    ...(input.terminology ?? {}),
  };

  const aiContext = buildAiContextEnvelope(
    personality.id,
    surface.aiSkills.map((skill) => skill.description),
  );

  const workspaceName = input.workspaceName ?? terminology.home ?? input.name;

  const capabilityConfig: ClientCapabilityConfig = {
    organizationId: input.organizationId,
    name: input.name,
    workspaceName,
    themeId: theme.id,
    personalityId: personality.id,
    enabledCapabilities: input.enabledCapabilityIds,
    plannedCapabilities: input.plannedCapabilityIds ?? [],
    terminology,
    aiProfile: input.aiProfile ?? personality.id,
  };

  return {
    organizationId: input.organizationId,
    name: input.name,
    workspaceName,
    theme,
    cssVars: workspaceThemeToCssVars(theme),
    personality,
    terminology,
    sectionOrder: personality.sectionOrder,
    dashboardSections: personality.dashboardSections,
    primaryActions: personality.primaryActions,
    emptyStateLanguage: personality.emptyStateLanguage,
    aiContext,
    surface,
    plannedCapabilityIds: input.plannedCapabilityIds ?? [],
    capabilityConfig,
  };
}
