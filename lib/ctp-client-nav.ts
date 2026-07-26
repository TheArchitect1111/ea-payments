/**
 * Client Experience navigation — Website + Portal / CTP workspace only.
 * Never includes Executive Workspace modules (Pulse, Simplifi, Amplifi, etc.).
 *
 * When UNIVERSAL_NAV_PACKS is enabled, labels/order/hrefs come from the `ctp-client`
 * IndustryPack while preserving the same five destinations.
 */
import { getClientByPortalSlug } from '@/lib/airtable';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import {
  designStudioPath,
  opportunityDashboardPath,
  portalCtpPath,
} from '@/lib/ctp-opportunity-routes';
import { isUniversalNavPacksEnabled } from '@/lib/portal-universal/flags';
import { getIndustryPack } from '@/lib/portal-universal/packs';

export type ClientExperienceNavId =
  | 'journey'
  | 'progress'
  | 'documents'
  | 'messages'
  | 'support';

export type ClientExperienceNavItem = {
  id: ClientExperienceNavId;
  label: string;
  href: string;
};

const CX_NAV_IDS: ClientExperienceNavId[] = [
  'progress',
  'documents',
  'messages',
  'support',
  'journey',
];

function legacyClientExperienceNav(slug: string): ClientExperienceNavItem[] {
  return [
    { id: 'progress', label: 'Your Project', href: designStudioPath(slug) },
    { id: 'documents', label: 'Documents', href: portalCtpPath(slug, 'ctp/documents') },
    { id: 'messages', label: 'Contact', href: portalCtpPath(slug, 'ctp/messages') },
    { id: 'support', label: 'Help', href: portalCtpPath(slug, 'ctp/support') },
    { id: 'journey', label: 'Journey', href: opportunityDashboardPath(slug) },
  ];
}

function defaultHrefForCxId(slug: string, id: ClientExperienceNavId): string {
  switch (id) {
    case 'progress':
      return designStudioPath(slug);
    case 'documents':
      return portalCtpPath(slug, 'ctp/documents');
    case 'messages':
      return portalCtpPath(slug, 'ctp/messages');
    case 'support':
      return portalCtpPath(slug, 'ctp/support');
    case 'journey':
      return opportunityDashboardPath(slug);
  }
}

/**
 * Pack-driven CX nav — structural destinations only (no entitlement filter).
 * CTP shell already gates who sees Client Experience.
 */
export function buildClientExperienceNavFromPack(slug: string): ClientExperienceNavItem[] {
  const pack = getIndustryPack('ctp-client');
  if (!pack?.useClientExperienceChrome) {
    return legacyClientExperienceNav(slug);
  }

  const byId = new Map(
    pack.nav
      .filter((item) => (item.visibility?.kind || 'when_entitled') !== 'never')
      .map((item) => [item.id, item]),
  );

  const items: ClientExperienceNavItem[] = [];
  for (const id of CX_NAV_IDS) {
    const row = byId.get(id);
    const href = row?.hrefOverride?.includes('{slug}')
      ? row.hrefOverride.replaceAll('{slug}', slug.trim())
      : row?.hrefOverride?.trim() || defaultHrefForCxId(slug, id);
    items.push({
      id,
      label: row?.label || legacyClientExperienceNav(slug).find((x) => x.id === id)!.label,
      href,
    });
  }

  items.sort((a, b) => {
    const oa = byId.get(a.id)?.order ?? 0;
    const ob = byId.get(b.id)?.order ?? 0;
    return oa - ob;
  });

  return items;
}

/**
 * Primary destinations match the client mental model.
 * Journey stays reachable but is not a competing home.
 */
export function buildClientExperienceNav(slug: string): ClientExperienceNavItem[] {
  if (isUniversalNavPacksEnabled()) {
    return buildClientExperienceNavFromPack(slug);
  }
  return legacyClientExperienceNav(slug);
}

export function resolveClientNavActive(
  pathname: string | null | undefined,
  slug: string,
): ClientExperienceNavId {
  const path = (pathname || '').replace(/\/+$/, '') || '/';
  const items = buildClientExperienceNav(slug);
  const ordered = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of ordered) {
    if (path === item.href || path.startsWith(`${item.href}/`)) return item.id;
  }
  return 'progress';
}

/**
 * Portals with a linked CTP submission use Client Experience chrome —
 * never the Executive Workspace sidebar.
 */
export async function shouldUseClientExperienceShell(slug: string): Promise<boolean> {
  const client = await getClientByPortalSlug(slug);
  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: client?.email,
  });
  if (!submission) return false;

  if (client?.commerceOfferId === 'website_portal_starter') return true;
  if (submission.clientType === 'website_portal') return true;
  return Boolean(submission.portalSlug || submission.workspaceStatus === 'Active');
}
