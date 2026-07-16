import type { OrbVisualState } from './types';

/** Lower index = higher priority (prompt order). */
export const ORB_STATE_PRIORITY: OrbVisualState[] = [
  'offline',
  'timeSensitive',
  'listening',
  'thinking',
  'speaking',
  'opportunity',
  'recommendation',
  'discovery',
  'success',
  'learning',
  'celebration',
  'quiet',
  'idle',
];

export function orbStatePriority(state: OrbVisualState): number {
  const idx = ORB_STATE_PRIORITY.indexOf(state);
  return idx === -1 ? ORB_STATE_PRIORITY.length : idx;
}

export function pickHighestOrbState(candidates: OrbVisualState[]): OrbVisualState {
  if (candidates.length === 0) return 'idle';
  return [...candidates].sort((a, b) => orbStatePriority(a) - orbStatePriority(b))[0];
}
