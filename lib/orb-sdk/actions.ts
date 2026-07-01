import type { EAGuideAction, EAGuideContextId } from '@/lib/ea-guide';
import type { OrbAction, OrbActionKind, OrbProduct, OrbVisualState } from './types';

const PRODUCT_MAP: Record<EAGuideContextId, OrbProduct> = {
  simplifi: 'simplifi',
  magnifi: 'magnifi',
  pulse: 'pulse',
  portal: 'portal',
  admin: 'admin',
  'update-hub': 'update-hub',
  learning: 'portal',
  cpr: 'portal',
  family: 'portal',
};

function mapActionKind(action: EAGuideAction): OrbActionKind {
  if (action.kind === 'href') return 'navigate';
  if (action.eventName?.includes('capture')) return 'capture';
  if (action.eventName?.includes('voice')) return 'voice';
  if (action.eventName?.includes('guide')) return 'guide';
  return 'event';
}

export function mapGuideAction(action: EAGuideAction): OrbAction {
  return {
    id: action.id,
    label: action.label,
    kind: mapActionKind(action),
    href: action.href,
    event: action.eventName,
  };
}

export const SIMPLIFI_ORB_ACTIONS: OrbAction[] = [
  { id: 'capture', label: 'Capture now', kind: 'capture', href: '/simplifi/capture' },
  { id: 'workspace', label: 'Open workspace', kind: 'navigate', href: '/simplifi/workspace' },
  { id: 'guide', label: 'Ask the guide', kind: 'guide', event: 'ea-guide:open' },
];

export function defaultOrbState(): OrbVisualState {
  return 'idle';
}

export function mapProduct(contextId: EAGuideContextId): OrbProduct {
  return PRODUCT_MAP[contextId] ?? 'unknown';
}
