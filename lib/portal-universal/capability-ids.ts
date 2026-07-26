/**
 * Canonical universal capability IDs (industry-agnostic).
 * Dual map with ModuleId (lib/modules/registry.ts) and CapabilityId (lib/experience-registry.ts).
 * @see docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md
 */
import type { ModuleId } from '@/lib/modules/registry';

export const UNIVERSAL_CAPABILITY_IDS = [
  'home',
  'people',
  'messages',
  'tasks',
  'calendar',
  'documents',
  'programs',
  'progress',
  'payments',
  'resources',
] as const;

export type UniversalCapabilityId = (typeof UNIVERSAL_CAPABILITY_IDS)[number];

/** Default Universal → ModuleId mapping (primary first). Empty = not shipped yet. */
export const UNIVERSAL_TO_MODULES: Record<UniversalCapabilityId, ModuleId[]> = {
  home: ['dashboard'],
  people: ['people'],
  messages: ['messaging', 'update-hub'],
  tasks: [],
  calendar: ['events'],
  documents: ['documents', 'ctp'],
  programs: ['ctp', 'simplifi', 'connect', 'amplifi', 'member'],
  progress: ['pulse', 'ctp'],
  payments: ['billing'],
  resources: ['resources', 'training', 'ask'],
};

export function isUniversalCapabilityId(value: string): value is UniversalCapabilityId {
  return (UNIVERSAL_CAPABILITY_IDS as readonly string[]).includes(value);
}
