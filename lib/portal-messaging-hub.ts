/**
 * Messaging launcher — Update Hub is the real advisor thread (no second store).
 */
import type { PortalClientRecord, ContentRequestRecord } from '@/lib/airtable';
import { getContentRequestsForClient } from '@/lib/airtable';
import { getPendingRequests, getPublishedFeedItems } from '@/lib/update-hub-feed';

export type PortalMessagingThread = {
  id: string;
  title: string;
  status: string;
  href: string;
  note: string;
};

export type PortalMessagingView = {
  threads: PortalMessagingThread[];
  pendingCount: number;
  publishedCount: number;
};

export async function listPortalMessagingThreads(
  slug: string,
  client: PortalClientRecord,
): Promise<PortalMessagingView> {
  let requests: ContentRequestRecord[] = [];
  if (client.id) {
    try {
      requests = await getContentRequestsForClient(client.id);
    } catch {
      requests = [];
    }
  }

  const pending = getPendingRequests(requests);
  const published = getPublishedFeedItems(requests);
  const recent = [...requests]
    .sort((a, b) => {
      const da = new Date(a.dateSubmitted || 0).getTime();
      const db = new Date(b.dateSubmitted || 0).getTime();
      return db - da;
    })
    .slice(0, 6);

  const threads: PortalMessagingThread[] = recent.map((req) => ({
    id: req.id,
    title: req.title || req.requestType || 'Advisor request',
    status: req.status,
    href: `/portal/${slug}/updates`,
    note: req.description?.slice(0, 140) || req.requestType || 'Open in Update Hub',
  }));

  return {
    threads,
    pendingCount: pending.length,
    publishedCount: published.length,
  };
}
