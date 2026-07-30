/**
 * Identity candidate resolution — user-supplied official URL is authoritative.
 * Search may supplement, never silently replace a supplied domain.
 */
import {
  createDefaultResearchAdapter,
  type ResearchHit,
} from '@/lib/experience-creation/research-adapter';

const BLOCKED_HOST_PARTS = [
  'bit.ly',
  't.co',
  'goo.gl',
  'doubleclick',
  'googletagmanager',
  'facebook.com/tr',
  'google-analytics',
];

const SOCIAL_HOSTS = new Set([
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'youtube.com',
  'tiktok.com',
  'pinterest.com',
]);

export type RejectedDomain = {
  domain: string;
  url?: string;
  reason: string;
};

export type IdentityResolution = {
  subjectName: string;
  /** Normalized absolute URLs to crawl first (supplied official seeds). */
  primarySeedUrls: string[];
  /** Supplied official hostnames — locked unless admin override. */
  lockedOfficialDomains: string[];
  /** Crawl allowlist: locked domains first, then verified supplements only. */
  officialDomains: string[];
  /** Supplemental crawl URLs (same locked domain or verified affiliates). */
  candidateUrls: string[];
  socialProfiles: Array<{ network: string; url: string }>;
  rejectedDomains: RejectedDomain[];
  /** @deprecated use rejectedDomains */
  rejectedNearNames: string[];
  searchHits: ResearchHit[];
  entityTypeHint: 'person' | 'organization' | 'product' | 'unknown';
  /** Person crawling an employer site — brand assets are employer-affiliated. */
  employerAffiliation: {
    active: boolean;
    employerDomain: string | null;
    employerNameHint: string | null;
  };
  identityStatus: 'resolved' | 'needs_clarification' | 'incomplete';
  clarificationQuestion: string | null;
  identityVerified: boolean;
};

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (!/^https?:$/i.test(u.protocol)) return null;
    u.hash = '';
    // Drop trailing slash for keying; keep pathname if meaningful.
    const path = u.pathname === '/' ? '/' : u.pathname.replace(/\/$/, '');
    return `${u.protocol}//${u.hostname.toLowerCase()}${path === '/' ? '/' : path}${u.search}`;
  } catch {
    return null;
  }
}

export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function isBlocked(url: string): boolean {
  const h = hostOf(url) || url.toLowerCase();
  return BLOCKED_HOST_PARTS.some((p) => h.includes(p));
}

function isSocial(host: string): boolean {
  return SOCIAL_HOSTS.has(host) || [...SOCIAL_HOSTS].some((s) => host.endsWith(`.${s}`));
}

function subjectTokens(subject: string): string[] {
  return subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function subjectSlug(subject: string): string {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Domain must strongly agree with subject name (e.g. ascensioncircle.org),
 * not a near-name org (ascensionacademy.com).
 */
export function domainAgreesWithSubject(host: string, subject: string): {
  ok: boolean;
  reason: string;
} {
  const slug = subjectSlug(subject);
  const hostCompact = host.replace(/\./g, '');
  const tokens = subjectTokens(subject).filter((t) => t.length > 2);

  if (slug.length >= 6 && hostCompact.includes(slug)) {
    return { ok: true, reason: 'host contains full subject slug' };
  }

  // All significant tokens appear in host (order flexible).
  if (tokens.length >= 2 && tokens.every((t) => hostCompact.includes(t))) {
    return { ok: true, reason: 'host contains all subject tokens' };
  }

  // Single-token org with strong host match.
  if (tokens.length === 1 && hostCompact.includes(tokens[0]!)) {
    return { ok: true, reason: 'host contains subject token' };
  }

  // Partial overlap only — near-name risk (academy vs circle, etc.).
  const overlapping = tokens.filter((t) => hostCompact.includes(t));
  if (overlapping.length > 0 && overlapping.length < tokens.length) {
    return {
      ok: false,
      reason: `near-name domain: host shares [${overlapping.join(', ')}] but not full subject "${subject}"`,
    };
  }

  return {
    ok: false,
    reason: `host "${host}" does not strongly match subject "${subject}"`,
  };
}

function looksLikePersonName(subject: string, detail?: string): boolean {
  const tokens = subjectTokens(subject);
  if (tokens.length < 2 || tokens.length > 4) return false;
  const blob = `${subject} ${detail || ''}`.toLowerCase();
  if (/\b(llc|inc|org|foundation|church|botanical|circle|academy|studio|agency)\b/.test(blob)) {
    return false;
  }
  return true;
}

function employerHintFromDetail(detail?: string): string | null {
  if (!detail) return null;
  const m = detail.match(/\b([A-Z0-9][A-Za-z0-9&.-]{1,40})\b/);
  // Prefer explicit org acronyms / names in notes (e.g. 3HC).
  const org = detail.match(/\b(3HC|Duke|UNC|[A-Z]{2,}(?:\s+[A-Z][a-z]+)?)\b/);
  return org?.[1] || null;
}

function personSurnameConfusion(subject: string, title: string, url: string): boolean {
  const tokens = subjectTokens(subject);
  if (tokens.length < 2) return false;
  const first = tokens[0]!;
  const last = tokens[tokens.length - 1]!;
  const blob = `${title} ${url}`.toLowerCase();
  if (!new RegExp(`\\b${last}\\b`, 'i').test(blob)) return false;
  if (blob.includes(subject.toLowerCase()) || (blob.includes(first) && blob.includes(last))) {
    return false;
  }
  return true;
}

/**
 * Content agreement check between subject / detail and a page title+url blob.
 */
export function contentAgreesWithSubject(input: {
  subjectName: string;
  distinguishingDetail?: string;
  title?: string;
  url: string;
}): { ok: boolean; reason: string } {
  const blob = `${input.title || ''} ${input.url} ${input.distinguishingDetail || ''}`.toLowerCase();
  const tokens = subjectTokens(input.subjectName);
  const hits = tokens.filter((t) => blob.includes(t));
  if (hits.length >= Math.min(2, tokens.length) || hits.length === tokens.length) {
    return { ok: true, reason: 'title/url agrees with subject tokens' };
  }
  const host = hostOf(input.url);
  if (host) {
    const d = domainAgreesWithSubject(host, input.subjectName);
    if (d.ok) return d;
  }
  return {
    ok: false,
    reason: `page content does not support subject "${input.subjectName}"`,
  };
}

export async function resolveIdentityCandidates(input: {
  subjectName: string;
  distinguishingDetail?: string;
  knownUrls?: string[];
  /** Admin-only: allow search hit to become official domain when locked domain absent. */
  allowSearchOfficialPromotion?: boolean;
}): Promise<IdentityResolution> {
  const rejectedDomains: RejectedDomain[] = [];
  const socialProfiles: Array<{ network: string; url: string }> = [];
  const primarySeedUrls: string[] = [];
  const lockedOfficialDomains: string[] = [];
  const seenUrls = new Set<string>();
  const seenHosts = new Set<string>();

  const person = looksLikePersonName(input.subjectName, input.distinguishingDetail);
  const entityTypeHint: IdentityResolution['entityTypeHint'] = person
    ? 'person'
    : /botanical|product|shop/i.test(`${input.subjectName} ${input.distinguishingDetail || ''}`)
      ? 'organization'
      : 'organization';

  // 1) User-supplied official URLs — normalize, verify, lock.
  for (const raw of input.knownUrls || []) {
    const url = normalizeUrl(raw);
    if (!url || isBlocked(url)) {
      if (raw.trim()) {
        rejectedDomains.push({
          domain: hostOf(raw) || raw,
          url: raw,
          reason: 'invalid or blocked supplied URL',
        });
      }
      continue;
    }
    const host = hostOf(url);
    if (!host) continue;

    if (isSocial(host)) {
      socialProfiles.push({ network: host.split('.')[0] || 'social', url });
      continue;
    }

    // For organizations, supplied domain must agree with name (or be accepted as
    // explicit operator-supplied official URL — still locked as primary).
    const agreement = domainAgreesWithSubject(host, input.subjectName);
    if (!person && !agreement.ok) {
      // Soft warning: still lock if operator explicitly supplied it — they own the choice.
      // But record that agreement is weak so completeness can fail verification.
      rejectedDomains.push({
        domain: host,
        url,
        reason: `supplied URL weakly matches name (${agreement.reason}); locked only as operator-supplied seed`,
      });
    }

    if (!seenUrls.has(url.split('?')[0]!.toLowerCase())) {
      seenUrls.add(url.split('?')[0]!.toLowerCase());
      primarySeedUrls.push(url);
    }
    if (!seenHosts.has(host)) {
      seenHosts.add(host);
      lockedOfficialDomains.push(host);
    }
  }

  // 2) Search supplements — never replace locked domains.
  const adapter = createDefaultResearchAdapter();
  const query = [input.subjectName, input.distinguishingDetail].filter(Boolean).join(' — ');
  let hits: ResearchHit[] = [];
  if (adapter.configured) {
    try {
      hits = await adapter.search(query);
    } catch {
      hits = [];
    }
  }

  const supplementalUrls: string[] = [];
  const conflictingOfficialCandidates: string[] = [];

  for (const hit of hits) {
    if (!hit.url || isBlocked(hit.url)) continue;
    const url = normalizeUrl(hit.url);
    if (!url) continue;
    const host = hostOf(url);
    if (!host) continue;
    const key = url.split('?')[0]!.toLowerCase();
    if (seenUrls.has(key)) continue;

    if (person && personSurnameConfusion(input.subjectName, hit.title || '', url)) {
      rejectedDomains.push({
        domain: host,
        url,
        reason: 'near-name person: surname match without given name (possible different individual)',
      });
      continue;
    }

    if (isSocial(host)) {
      seenUrls.add(key);
      socialProfiles.push({ network: host.split('.')[0] || 'social', url });
      continue;
    }

    // Same locked domain → allowed supplement path.
    if (lockedOfficialDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
      seenUrls.add(key);
      supplementalUrls.push(url);
      continue;
    }

    const agreement = domainAgreesWithSubject(host, input.subjectName);
    const content = contentAgreesWithSubject({
      subjectName: input.subjectName,
      distinguishingDetail: input.distinguishingDetail,
      title: hit.title,
      url,
    });

    if (!agreement.ok) {
      rejectedDomains.push({
        domain: host,
        url,
        reason: agreement.reason,
      });
      continue;
    }

    if (!content.ok) {
      rejectedDomains.push({
        domain: host,
        url,
        reason: content.reason,
      });
      continue;
    }

    // Strong agreement — still cannot replace locked official without admin flag.
    if (lockedOfficialDomains.length > 0) {
      rejectedDomains.push({
        domain: host,
        url,
        reason:
          'search candidate agrees with name but cannot replace user-supplied official domain without administrator approval',
      });
      // Keep as non-official supplement only if same registrable intent — do not add to officialDomains.
      continue;
    }

    // No locked domain: only promote with strong agreement + optional admin flag.
    if (input.allowSearchOfficialPromotion) {
      seenUrls.add(key);
      supplementalUrls.push(url);
      if (!seenHosts.has(host)) {
        seenHosts.add(host);
        conflictingOfficialCandidates.push(host);
      }
    } else {
      conflictingOfficialCandidates.push(host);
      rejectedDomains.push({
        domain: host,
        url,
        reason:
          'search-discovered domain held pending confirmation — will not become official without supplied URL or administrator approval',
      });
    }
  }

  const officialDomains = [...lockedOfficialDomains];
  let identityStatus: IdentityResolution['identityStatus'] = 'incomplete';
  let clarificationQuestion: string | null = null;
  let identityVerified = lockedOfficialDomains.length > 0;

  if (lockedOfficialDomains.length === 0 && conflictingOfficialCandidates.length > 1) {
    identityStatus = 'needs_clarification';
    identityVerified = false;
    clarificationQuestion = `Which official website is correct for ${input.subjectName}? Candidates: ${[
      ...new Set(conflictingOfficialCandidates),
    ]
      .slice(0, 5)
      .join(', ')}`;
  } else if (lockedOfficialDomains.length === 0 && conflictingOfficialCandidates.length === 1) {
    identityStatus = 'needs_clarification';
    identityVerified = false;
    clarificationQuestion = `Confirm official domain for ${input.subjectName}: ${conflictingOfficialCandidates[0]}?`;
  } else if (lockedOfficialDomains.length > 0) {
    identityStatus = 'resolved';
    // Verify locked domain strongly matches org name when not a person/employer case.
    if (!person) {
      const weak = lockedOfficialDomains.filter((d) => !domainAgreesWithSubject(d, input.subjectName).ok);
      if (weak.length === lockedOfficialDomains.length) {
        identityVerified = false;
        identityStatus = 'needs_clarification';
        clarificationQuestion = `Supplied domain(s) ${lockedOfficialDomains.join(', ')} do not strongly match "${input.subjectName}". Confirm this is the correct official site?`;
      }
    }
  }

  const employerNameHint = person ? employerHintFromDetail(input.distinguishingDetail) : null;
  const employerDomain =
    person && lockedOfficialDomains[0]
      ? lockedOfficialDomains[0]
      : null;

  // Candidate crawl list: primary seeds first, then same-domain supplements.
  const candidateUrls = [
    ...primarySeedUrls,
    ...supplementalUrls.filter((u) => {
      const h = hostOf(u);
      return h && lockedOfficialDomains.some((d) => h === d || h.endsWith(`.${d}`));
    }),
  ].slice(0, 24);

  return {
    subjectName: input.subjectName,
    primarySeedUrls,
    lockedOfficialDomains,
    officialDomains,
    candidateUrls,
    socialProfiles: socialProfiles.slice(0, 12),
    rejectedDomains,
    rejectedNearNames: rejectedDomains.map((r) => r.url || r.domain),
    searchHits: hits,
    entityTypeHint,
    employerAffiliation: {
      active: Boolean(person && employerDomain),
      employerDomain,
      employerNameHint,
    },
    identityStatus,
    clarificationQuestion,
    identityVerified,
  };
}
