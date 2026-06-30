import { listRecentPulseEvents, type PulseEvent } from '@/lib/pulse-bus';

export type PortalNotification = PulseEvent & {
  id: string;
  at: string;
  read: boolean;
};

const readKeys = new Set<string>();

function notificationKey(slug: string, email: string, at: string, title: string): string {
  return `${slug}:${email}:${at}:${title}`;
}

function eventMatchesPortal(event: PulseEvent & { at: string }, slug: string): boolean {
  if (event.tenantId === slug) return true;
  if (event.href?.includes(`/portal/${slug}`)) return true;
  return false;
}

export function listPortalNotifications(input: {
  slug: string;
  email: string;
  limit?: number;
}): PortalNotification[] {
  const limit = input.limit ?? 40;

  return listRecentPulseEvents(limit * 2)
    .filter((event) => eventMatchesPortal(event, input.slug))
    .slice(0, limit)
    .map((event) => {
      const key = notificationKey(input.slug, input.email, event.at, event.title);
      return {
        ...event,
        id: key,
        read: readKeys.has(key),
      };
    });
}

export function countUnreadNotifications(slug: string, email: string): number {
  return listPortalNotifications({ slug, email, limit: 50 }).filter((n) => !n.read).length;
}

export function markPortalNotificationsRead(
  slug: string,
  email: string,
  ids?: string[],
): number {
  const notifications = listPortalNotifications({ slug, email, limit: 50 });
  let marked = 0;

  for (const notification of notifications) {
    if (ids && !ids.includes(notification.id)) continue;
    if (!readKeys.has(notification.id)) {
      readKeys.add(notification.id);
      marked += 1;
    }
  }

  return marked;
}
