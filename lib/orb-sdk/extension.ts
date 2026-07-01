import { SIMPLIFI_ORB_ACTIONS } from './actions';
import type { OrbAction } from './types';

/** Extension-only orb actions (plus shared Simplifi actions). */
export const EXTENSION_ORB_ACTIONS: OrbAction[] = [
  ...SIMPLIFI_ORB_ACTIONS,
  { id: 'watch', label: 'Watch this page', kind: 'capture', event: 'simplifi:watch' },
  { id: 'analyze', label: 'Analyze opportunity', kind: 'capture', event: 'simplifi:analyze' },
  { id: 'followup', label: 'Follow up later', kind: 'event', event: 'simplifi:followup' },
  { id: 'watchlist', label: 'Open watch list', kind: 'navigate', event: 'simplifi:watchlist' },
  { id: 'recent', label: 'Recent opportunities', kind: 'navigate', event: 'simplifi:recent' },
  { id: 'brief', label: 'Daily brief', kind: 'guide', event: 'simplifi:brief' },
];

export type OrbUrlMap = {
  capture: string;
  workspace: string;
  settings: string;
  connect: string;
};

export function buildOrbUrls(baseUrl: string): OrbUrlMap {
  const base = baseUrl.replace(/\/$/, '');
  return {
    capture: `${base}/simplifi/capture`,
    workspace: `${base}/simplifi/workspace`,
    settings: `${base}/simplifi/settings`,
    connect: `${base}/extension/connect`,
  };
}
