import type { SimplifiObject } from './simplifi-objects';

const STALE_DAYS = 30;
const OVERDUE_GRACE_DAYS = 0;

export interface ExpirationAlert {
  objectId: string;
  title: string;
  detail: string;
  kind: 'overdue' | 'stale' | 'due-soon';
  href?: string;
  daysSinceCapture: number;
}

function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

function daysUntilDue(dueDate: string): number | null {
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}

export function buildExpirationAlerts(objects: SimplifiObject[]): ExpirationAlert[] {
  const alerts: ExpirationAlert[] = [];

  for (const o of objects) {
    if (o.status === 'archived' || o.status === 'analyzing') continue;

    const age = daysSince(o.dateCaptured);
    const dueIn = o.dueDate ? daysUntilDue(o.dueDate) : null;

    if (dueIn != null && dueIn < OVERDUE_GRACE_DAYS) {
      alerts.push({
        objectId: o.id,
        title: o.title,
        detail: `Active Save overdue — ${o.savePurpose ?? o.nextAction}. Due ${o.dueDate}.`,
        kind: 'overdue',
        href: o.considerUrl ?? '/simplifi/capture',
        daysSinceCapture: age,
      });
      continue;
    }

    if (dueIn != null && dueIn <= 7) {
      alerts.push({
        objectId: o.id,
        title: o.nextAction,
        detail: `Due in ${dueIn} day${dueIn === 1 ? '' : 's'} · ${o.savePurpose ?? 'Active Save'}`,
        kind: 'due-soon',
        href: o.considerUrl ?? '/simplifi/workspace',
        daysSinceCapture: age,
      });
      continue;
    }

    if (age >= STALE_DAYS && o.savePurpose) {
      alerts.push({
        objectId: o.id,
        title: o.title,
        detail: `Saved ${age} days ago as "${o.savePurpose}" — still interested?`,
        kind: 'stale',
        href: o.considerUrl ?? '/simplifi/workspace',
        daysSinceCapture: age,
      });
    }
  }

  const order = { overdue: 0, 'due-soon': 1, stale: 2 };
  return alerts.sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 5);
}
