/**
 * Client Measure slice — Pulse bus activity for a portal slug.
 */
import { listRecentPulseEvents } from '@/lib/pulse-bus';

export type TenantPulseMeasureItem = {
  title: string;
  detail?: string;
  at: string;
  priority?: string;
  href?: string;
};

export function getTenantPulseMeasure(slug: string): {
  recent: TenantPulseMeasureItem[];
  counts: { total: number; highOrCritical: number };
} {
  const clean = slug.trim().toLowerCase();
  const all = listRecentPulseEvents(80);
  const matched = all.filter((ev) => {
    if (ev.tenantId?.toLowerCase() === clean) return true;
    const metaSlug = ev.metadata?.portalSlug;
    if (typeof metaSlug === 'string' && metaSlug.toLowerCase() === clean) return true;
    if (ev.href?.includes(`/portal/${clean}`) || ev.href?.includes(`/sites/${clean}`)) {
      return true;
    }
    if (ev.objectId?.toLowerCase() === clean) return true;
    return false;
  });

  const recent = matched.slice(0, 12).map((ev) => ({
    title: ev.title,
    detail: ev.detail,
    at: ev.at,
    priority: ev.priority,
    href: ev.href,
  }));

  const highOrCritical = matched.filter(
    (ev) => ev.priority === 'high' || ev.priority === 'critical',
  ).length;

  return {
    recent,
    counts: { total: matched.length, highOrCritical },
  };
}
