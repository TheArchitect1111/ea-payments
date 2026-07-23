/**
 * Client Experience navigation — Website + Portal / CTP workspace only.
 * Never includes Executive Workspace modules (Pulse, Simplifi, Amplifi, etc.).
 */
import { getClientByPortalSlug } from '@/lib/airtable';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import {
  designStudioPath,
  opportunityDashboardPath,
  portalCtpPath,
} from '@/lib/ctp-opportunity-routes';

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

/**
 * Primary destinations match the client mental model.
 * Journey stays reachable but is not a competing home.
 */
export function buildClientExperienceNav(slug: string): ClientExperienceNavItem[] {
  return [
    { id: 'progress', label: 'Your Project', href: designStudioPath(slug) },
    { id: 'documents', label: 'Documents', href: portalCtpPath(slug, 'ctp/documents') },
    { id: 'messages', label: 'Contact', href: portalCtpPath(slug, 'ctp/messages') },
    { id: 'support', label: 'Help', href: portalCtpPath(slug, 'ctp/support') },
    { id: 'journey', label: 'Journey', href: opportunityDashboardPath(slug) },
  ];
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
  // Any bound CTP workspace (intake or Website + Portal) stays in Client Experience.
  return Boolean(submission.portalSlug || submission.workspaceStatus === 'Active');
}
