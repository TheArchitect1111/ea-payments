/**
 * Client Experience navigation — Website + Portal / CTP workspace only.
 * Never includes Executive Workspace modules (Pulse, Simplifi, Amplifi, etc.).
 *
 * When UNIVERSAL_NAV_PACKS is enabled, labels/order/hrefs come from the resolved
 * IndustryPack while preserving pack-driven CX destinations.
 *
 * Client components must import types/helpers from `@/lib/ctp-client-nav-shared`.
 */
import { getClientByPortalSlug } from '@/lib/airtable';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import {
  designStudioPath,
  opportunityDashboardPath,
  portalCtpPath,
} from '@/lib/ctp-opportunity-routes';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { isUniversalNavPacksEnabled } from '@/lib/portal-universal/flags';
import type { IndustryNavItem, IndustryPackId } from '@/lib/portal-universal/industry-pack';
import { getIndustryPack } from '@/lib/portal-universal/packs';
import { resolvePackForOrg } from '@/lib/portal-universal/resolve-pack-for-org';
import type {
  ClientExperienceNavId,
  ClientExperienceNavItem,
} from '@/lib/ctp-client-nav-shared';

export type { ClientExperienceNavId, ClientExperienceNavItem } from '@/lib/ctp-client-nav-shared';
export { isQuietClientExperienceNavId } from '@/lib/ctp-client-nav-shared';

const LEGACY_CX_NAV_IDS: ClientExperienceNavId[] = [
  'progress',
  'documents',
  'messages',
  'support',
  'journey',
];

const PACK_CX_NAV_IDS = new Set<string>([
  'progress',
  'pipeline',
  'documents',
  'messages',
  'support',
  'journey',
  'listings',
  'intake',
]);

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
    case 'pipeline':
      return designStudioPath(slug);
    case 'documents':
      return portalCtpPath(slug, 'ctp/documents');
    case 'messages':
      return portalCtpPath(slug, 'ctp/messages');
    case 'support':
      return portalCtpPath(slug, 'ctp/support');
    case 'journey':
    case 'listings':
      return opportunityDashboardPath(slug);
    case 'intake':
      return `/portal/${slug}/intake`;
  }
}

function resolveHref(slug: string, row: IndustryNavItem, id: ClientExperienceNavId): string {
  if (row.hrefOverride?.includes('{slug}')) {
    return row.hrefOverride.replaceAll('{slug}', slug.trim());
  }
  if (row.hrefOverride?.trim()) return row.hrefOverride.trim();
  return defaultHrefForCxId(slug, id);
}

function packItemToNavItem(slug: string, row: IndustryNavItem): ClientExperienceNavItem | null {
  if (!PACK_CX_NAV_IDS.has(row.id)) return null;
  const id = row.id as ClientExperienceNavId;
  return {
    id,
    label: row.label,
    href: resolveHref(slug, row, id),
  };
}

/**
 * Pack-driven CX nav — structural destinations only (no entitlement filter).
 * CTP shell already gates who sees Client Experience.
 */
export function buildClientExperienceNavFromPack(
  slug: string,
  packId?: IndustryPackId,
): ClientExperienceNavItem[] {
  const pack = getIndustryPack(packId || 'ctp-client');
  if (!pack?.useClientExperienceChrome) {
    return legacyClientExperienceNav(slug);
  }

  const visible = pack.nav
    .filter((item) => (item.visibility?.kind || 'when_entitled') !== 'never')
    .filter((item) => PACK_CX_NAV_IDS.has(item.id))
    .sort((a, b) => a.order - b.order);

  if (visible.length === 0) {
    return legacyClientExperienceNav(slug);
  }

  const items: ClientExperienceNavItem[] = [];
  for (const row of visible) {
    const item = packItemToNavItem(slug, row);
    if (item) items.push(item);
  }

  if (items.length === 0) {
    const byId = new Map(pack.nav.map((item) => [item.id, item]));
    for (const id of LEGACY_CX_NAV_IDS) {
      const row = byId.get(id);
      items.push({
        id,
        label: row?.label || legacyClientExperienceNav(slug).find((x) => x.id === id)!.label,
        href: row ? resolveHref(slug, row, id) : defaultHrefForCxId(slug, id),
      });
    }
  }

  return items;
}

/**
 * Primary destinations match the client mental model.
 * Journey / listings stay reachable but are not competing home links.
 */
export async function buildClientExperienceNav(slug: string): Promise<ClientExperienceNavItem[]> {
  if (!isUniversalNavPacksEnabled()) {
    return legacyClientExperienceNav(slug);
  }

  const [org, client] = await Promise.all([
    findOrganizationByPortalSlug(slug),
    getClientByPortalSlug(slug),
  ]);

  const pack = resolvePackForOrg({
    organization: org,
    portalSlug: slug,
    preferClientExperience: true,
    industryPackId: org?.industryPackId,
    commerceOfferId: client?.commerceOfferId,
    packagePurchased: client?.packagePurchased,
  });

  return buildClientExperienceNavFromPack(slug, pack.id);
}

export async function resolveClientNavActive(
  pathname: string | null | undefined,
  slug: string,
): Promise<ClientExperienceNavId> {
  const path = (pathname || '').replace(/\/+$/, '') || '/';
  const items = await buildClientExperienceNav(slug);
  const ordered = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of ordered) {
    if (path === item.href || path.startsWith(`${item.href}/`)) return item.id;
  }
  return items.some((item) => item.id === 'progress')
    ? 'progress'
    : items.some((item) => item.id === 'pipeline')
      ? 'pipeline'
      : 'progress';
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
