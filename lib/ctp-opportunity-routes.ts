/**
 * EA Opportunity Experience™ — canonical portal routes (Phase 1).
 * Single source of truth for post-CTP journey URLs. Do not invent alternate entry paths.
 */
import { publicPortalUrl } from '@/lib/ctp-portal-host';

/** Path suffixes under `/portal/{slug}/` for the Opportunity Experience journey. */
export const CTP_OPPORTUNITY_SEGMENTS = {
  /** Story / Journey surface (not the Guide front door). */
  dashboard: 'ctp',
  review: 'ctp/review',
  /** Detail pages: `ctp/opportunities/{opportunityId}` */
  detail: 'ctp/opportunities',
  /** Guide home — Progress (canonical client front door). */
  designStudio: 'ctp/progress',
  schedule: 'ctp/schedule',
} as const;

export type CtpOpportunitySegment = keyof typeof CTP_OPPORTUNITY_SEGMENTS;

/** Internal app path: `/portal/{slug}/…` */
export function portalCtpPath(slug: string, segment: string): string {
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
  const suffix = segment.replace(/^\/+|\/+$/g, '');
  return suffix ? `/portal/${cleanSlug}/${suffix}` : `/portal/${cleanSlug}`;
}

export function opportunityDashboardPath(slug: string): string {
  return portalCtpPath(slug, CTP_OPPORTUNITY_SEGMENTS.dashboard);
}

export function opportunityReviewPath(slug: string): string {
  return portalCtpPath(slug, CTP_OPPORTUNITY_SEGMENTS.review);
}

export function opportunityDetailPath(slug: string, opportunityId: string): string {
  const id = opportunityId.trim().replace(/^\/+|\/+$/g, '');
  return `${portalCtpPath(slug, CTP_OPPORTUNITY_SEGMENTS.detail)}/${id}`;
}

export function designStudioPath(slug: string): string {
  return portalCtpPath(slug, CTP_OPPORTUNITY_SEGMENTS.designStudio);
}

export function opportunitySchedulePath(slug: string): string {
  return portalCtpPath(slug, CTP_OPPORTUNITY_SEGMENTS.schedule);
}

/**
 * Public Guide URL for emails and provision CTAs.
 * Default: `https://efficiencyarchitects.online/portal/{slug}/ctp/progress`
 */
export function opportunityDashboardPublicUrl(slug: string): string {
  return publicPortalUrl(slug, CTP_OPPORTUNITY_SEGMENTS.designStudio);
}

/** Relative suffix passed to `publicPortalUrl(slug, suffix)` for welcome emails. */
export function opportunityEmailPathSuffix(): string {
  return CTP_OPPORTUNITY_SEGMENTS.designStudio;
}

/**
 * Where CTP clients land after portal home or email CTA — Guide Progress.
 */
export function resolveCtpClientLandingPath(slug: string): string {
  return designStudioPath(slug);
}
