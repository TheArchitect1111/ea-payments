import { listRecentPulseEvents, type PulseEvent } from '@/lib/pulse-bus';
import {
  getReadNotificationKeys,
  markAllNotificationsRead,
  markNotificationKeysRead,
} from '@/lib/notification-read-store';

export type PortalNotification = PulseEvent & {
  id: string;
  at: string;
  read: boolean;
};

function notificationKey(slug: string, email: string, at: string, title: string): string {
  return `${slug}:${email}:${at}:${title}`;
}

function eventMatchesPortal(event: PulseEvent & { at: string }, slug: string): boolean {
  if (event.tenantId === slug) return true;
  if (event.href?.includes(`/portal/${slug}`)) return true;
  return false;
}

export async function listPortalNotifications(input: {
  slug: string;
  email: string;
  limit?: number;
}): Promise<PortalNotification[]> {
  const limit = input.limit ?? 40;
  const readKeys = await getReadNotificationKeys(input.slug, input.email);

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

export async function countUnreadNotifications(slug: string, email: string): Promise<number> {
  const notifications = await listPortalNotifications({ slug, email, limit: 50 });
  return notifications.filter((n) => !n.read).length;
}

export async function markPortalNotificationsRead(
  slug: string,
  email: string,
  ids?: string[],
): Promise<number> {
  const notifications = await listPortalNotifications({ slug, email, limit: 50 });

  if (!ids) {
    return markAllNotificationsRead(
      slug,
      email,
      notifications.map((n) => n.id),
    );
  }

  return markNotificationKeysRead(slug, email, ids);
}
