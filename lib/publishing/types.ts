export type PublishChannel =
  | 'amplifi'
  | 'portal'
  | 'content-request'
  | 'website'
  | 'print'
  | 'manual';

export type PublishMode = 'webhook' | 'airtable' | 'manual' | 'stub';

export type PublishOutcome = {
  ok: boolean;
  mode: PublishMode;
  detail: string;
  href?: string;
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
  source?: { product: string; campaignId?: string; assetId?: string };
};
