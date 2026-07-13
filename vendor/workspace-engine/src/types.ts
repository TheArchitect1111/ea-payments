import type { AssembledSurface } from '@ea/module-engine';
import type { WorkspacePersonality } from '@ea/personality-engine';
import type { WorkspaceTheme } from '@ea/theme-engine';
import type { ClientCapabilityConfig } from '@ea/capability-registry';

/** Input envelope for assembling a workspace shell (apps as configuration). */
export type WorkspaceAssembleInput = {
  organizationId: string;
  name: string;
  workspaceName?: string;
  themeId?: string;
  /** Partial theme overlay (wins over themeId defaults). */
  theme?: Partial<WorkspaceTheme>;
  personalityId?: string;
  /** Partial personality overlay. */
  personality?: Partial<WorkspacePersonality> & { id?: string };
  /** Canonical capability ids OR enable keys resolved by caller. */
  enabledCapabilityIds: string[];
  plannedCapabilityIds?: string[];
  terminology?: Record<string, string>;
  aiProfile?: string;
};

/** Client-agnostic shell the Workspace Engine renders ? no CPR/ETFM domain logic. */
export type WorkspaceShell = {
  organizationId: string;
  name: string;
  workspaceName: string;
  theme: WorkspaceTheme;
  cssVars: Record<string, string>;
  personality: WorkspacePersonality;
  terminology: Record<string, string>;
  sectionOrder: string[];
  dashboardSections: string[];
  primaryActions: string[];
  emptyStateLanguage: string;
  aiContext: string;
  surface: AssembledSurface;
  plannedCapabilityIds: string[];
  capabilityConfig: ClientCapabilityConfig;
};
