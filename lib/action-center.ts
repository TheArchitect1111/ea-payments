import type { SimplifiObject } from './simplifi-objects';
import { buildExpirationAlerts } from './smart-expiration';
import { computePriorityScore, priorityLevelLabel, type PriorityLevel } from './priority-engine';
import { sortInbox } from './simplifi-objects';

export interface ActionCenterItem {
  id: string;
  title: string;
  detail: string;
  href?: string;
  priority: PriorityLevel;
  section: 'attention' | 'recommended' | 'watchlist';
}

export interface ActionCenterPayload {
  needsAttention: ActionCenterItem[];
  recommended: ActionCenterItem[];
  watchlist: ActionCenterItem[];
}

export function buildActionCenter(objects: SimplifiObject[]): ActionCenterPayload {
  const sorted = sortInbox(objects);
  const needsAttention: ActionCenterItem[] = [];
  const recommended: ActionCenterItem[] = [];
  const watchlist: ActionCenterItem[] = [];

  for (const alert of buildExpirationAlerts(sorted)) {
    needsAttention.push({
      id: `att-${alert.objectId}`,
      title: alert.title,
      detail: alert.detail,
      href: alert.href,
      priority: alert.kind === 'overdue' ? 'critical' : 'high',
      section: 'attention',
    });
  }

  for (const obj of sorted.slice(0, 8)) {
    const ps = computePriorityScore(obj);
    if (ps.level === 'critical' || ps.level === 'high') {
      recommended.push({
        id: `rec-${obj.id}`,
        title: obj.nextAction,
        detail: `${priorityLevelLabel(ps.level)} · ${obj.title}`,
        href: obj.considerUrl ?? '/simplifi/capture',
        priority: ps.level,
        section: 'recommended',
      });
    } else if (obj.savePurpose) {
      watchlist.push({
        id: `watch-${obj.id}`,
        title: obj.title,
        detail: `${obj.savePurpose}${obj.dueDate ? ` · due ${obj.dueDate}` : ''}`,
        href: obj.considerUrl,
        priority: ps.level,
        section: 'watchlist',
      });
    }
  }

  return {
    needsAttention: needsAttention.slice(0, 4),
    recommended: recommended.slice(0, 4),
    watchlist: watchlist.slice(0, 4),
  };
}
