import { listRecentPulseEvents } from './pulse-bus';
import type { DailyBriefItem } from './simplifi-objects';

export function pulseEventsForBrief(tenantSlug?: string, limit = 4): DailyBriefItem[] {
  return listRecentPulseEvents(20)
    .filter((evt) => {
      if (!tenantSlug) return true;
      return !evt.tenantId || evt.tenantId === tenantSlug;
    })
    .slice(0, limit)
    .map((evt) => ({
      id: `pulse-${evt.at}-${evt.type}`,
      title: evt.title,
      detail: evt.detail ?? evt.type.replace('.', ' · '),
      href: evt.href,
      kind: evt.type.includes('outcome') ? 'momentum' : 'explore',
    }));
}
