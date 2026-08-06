export type PublishChannel =
  | 'amplifi'
  | 'portal'
  | 'content-request'
  | 'website'
  | 'print'
  | 'manual';

export type PublishMode = 'webhook' | 'airtable' | 'manual' | 'stub';

export type PublishStatus = 'blocked' | 'queued' | 'published' | 'failed';

export type PublishOutcome = {
  ok: boolean;
  mode: PublishMode;
  status: PublishStatus;
  detail: string;
  href?: string;
  externalId?: string;
  idempotencyKey?: string;
  attemptedAt: string;
  retryable: boolean;
};

export type PublishCommunicationInput = {
  channel: PublishChannel;
  portalSlug: string;
  title: string;
  body: string;
  summary?: string;
  requestType?: string;
  storyUrl?: string;
  actorName: string;
  contentRequestStatus?: string;
  idempotencyKey?: string;
  media?: {
    url: string;
    mimeType?: string;
    altText?: string;
    width?: number;
    height?: number;
  };
  source?: { product: string; campaignId?: string; assetId?: string };
};
