import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';

export type OrbVisualState =
  | 'idle'
  | 'quiet'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'discovery'
  | 'recommendation'
  | 'opportunity'
  | 'timeSensitive'
  | 'success'
  | 'learning'
  | 'celebration'
  | 'offline';

/** Transient Orb flash after a real user action (not derived from Brief). */
export type OrbOutcomeFlash = 'success' | 'learning' | 'celebration';

export type OrbFinding = {
  id: string;
  title: string;
  detail?: string;
  href?: string;
};

export type OrbRecommendation = {
  label: string;
  href: string;
  why?: string;
};

export type OrbBriefSlice = {
  greeting: string;
  items: { id: string; title: string; detail: string; href?: string; kind?: string }[];
  recommendedNext: { label: string; href: string } | null;
};

export type OrbSessionInput = {
  pathname: string;
  brief: OrbBriefSlice;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  /** Transient interaction overrides */
  interaction?: 'listening' | 'thinking' | 'speaking' | null;
  online?: boolean;
  entityId?: string | null;
};

export type OrbSessionContext = {
  state: OrbVisualState;
  priority: number;
  title: string;
  summary: string;
  findings: OrbFinding[];
  recommendation: OrbRecommendation | null;
  currentRoute: string;
  unreadCount: number;
  dueCount: number;
  ariaLabel: string;
};
