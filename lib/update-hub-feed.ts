import type { ContentRequestRecord } from './airtable';

export type UpdateHubFeedItem = {
  id: string;
  date: string;
  title: string;
  body: string;
  requestType: string;
  status: string;
};

const PUBLISHED_STATUSES = new Set(['Published', 'Completed']);

export function getPublishedFeedItems(requests: ContentRequestRecord[]): UpdateHubFeedItem[] {
  return requests
    .filter((r) => PUBLISHED_STATUSES.has(r.status))
    .map((r) => ({
      id: r.id,
      date: r.datePublished ?? r.dateSubmitted ?? '',
      title: r.title,
      body: r.publishedContent ?? r.aiAnalysis ?? r.content ?? r.description ?? '',
      requestType: r.requestType,
      status: r.status,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPendingRequests(requests: ContentRequestRecord[]): ContentRequestRecord[] {
  return requests.filter((r) =>
    ['Pending Review', 'In Progress', 'Awaiting Approval', 'Needs Additional Information'].includes(
      r.status,
    ),
  );
}

export function getQueueRequests(requests: ContentRequestRecord[]): ContentRequestRecord[] {
  return requests.filter((r) =>
    ['Pending Review', 'In Progress', 'Awaiting Approval', 'Scheduled'].includes(r.status),
  );
}
