/**
 * Pretix event engine for Event Hub™ — registration/payments/confirmations live in pretix;
 * EA portal lists events, deep-links to the shop, and ingests order webhooks into Pulse.
 *
 * Disabled until at least one event is configured (store or PRETIX_EVENTS_JSON).
 */
export type PortalPretixEventStatus = 'draft' | 'published' | 'closed';

export type PortalPretixEvent = {
  id: string;
  portalSlug: string;
  title: string;
  summary: string;
  /** Public pretix shop / event URL (Hosted or self-host). */
  shopUrl: string;
  /** Optional pretix event slug for webhook matching. */
  pretixEventSlug?: string;
  /** Optional pretix organizer slug. */
  pretixOrganizerSlug?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  status: PortalPretixEventStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};

export type PretixIntegrationConfig = {
  configured: boolean;
  webhookSecretConfigured: boolean;
  eventCount: number;
  docs: string;
};

export function isValidPretixShopUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:') return false;
    // Hosted or self-host — require a path so bare domains are rejected.
    return url.pathname.length > 1;
  } catch {
    return false;
  }
}

export function pretixConfigured(eventCount: number): boolean {
  return eventCount > 0;
}
