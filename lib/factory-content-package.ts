/**
 * Research → structured content_package for UXG previews.
 * Never uses launch goals, WorkOrders, or generic slogan fallbacks as public copy.
 */
import { listArtifacts } from '@/lib/factory-artifact';
import {
  containsForbiddenPublicCopy,
  scrubForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import { parseDistinguishingDetail } from '@/lib/factory-identity-gate';
import {
  evaluateEvidenceQuality,
  isEvidenceRelevantToSubject,
} from '@/lib/factory-evidence-quality';
import { projectContextFromProject, type ProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';
import { buildStructuredEvidenceModel } from '@/lib/uxg/evidence-model';
import { buildLensCopyFromEvidence } from '@/lib/uxg/lens-copy-from-evidence';

export const CONTENT_PACKAGE_WORKER = 'content-package';

export type ContentPackageClaim = {
  text: string;
  sourceUrl?: string;
  status: 'verified' | 'inferred' | 'admin_clarification';
};

export type ContentPackageLensCopy = {
  heroHeadline: string;
  heroSupporting: string;
  aboutTitle: string;
  aboutBody: string;
  sectionHeadlines: string[];
  sectionBodies: string[];
  ctaLabel: string;
  portalPurpose: string;
};

export type ContentPackage = {
  schemaVersion: 1;
  generatedAt: string;
  projectId: string;
  name: string;
  positioning: string;
  centralStory: string;
  biography: string;
  milestones: string[];
  accomplishments: string[];
  currentWork: string[];
  organizations: string[];
  audience: string;
  callsToAction: string[];
  mediaPlan: {
    strategy: string;
    items: Array<{ label: string; status: string; source?: string }>;
  };
  claims: ContentPackageClaim[];
  sources: Array<{ url: string; label?: string }>;
  lenses: {
    cinematic: ContentPackageLensCopy;
    editorial: ContentPackageLensCopy;
    intimate: ContentPackageLensCopy;
  };
  quality: {
    factCount: number;
    sourceCount: number;
    ready: boolean;
    missing: string[];
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  const cleaned = scrubForbiddenPublicCopy(typeof value === 'string' ? value : undefined);
  return cleaned;
}

function pushUnique(list: string[], value: string | undefined) {
  const cleaned = scrubForbiddenPublicCopy(value);
  if (!cleaned) return;
  // Reject multi-sentence / run-on captures mistaken for organization names.
  if (cleaned.length > 64 || /[.!]/.test(cleaned)) return;
  if (list.some((item) => item.toLowerCase() === cleaned.toLowerCase())) return;
  list.push(cleaned);
}

function extractFromNotes(notes: string | undefined): string[] {
  const detail = parseDistinguishingDetail(notes);
  if (!detail) return [];
  return detail
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12 && !containsForbiddenPublicCopy(part));
}

/**
 * Build a content package from research / discovery artifacts + admin clarification.
 */
export function buildContentPackageFromProject(project: FactoryProject): ContentPackage {
  const context = project.context ? projectContextFromProject(project) : null;
  return buildContentPackageFromContext(project.id, project.client, project.notes, context);
}

export function buildContentPackageFromContext(
  projectId: string,
  client: string,
  notes: string | undefined,
  context: ProjectContext | null,
): ContentPackage {
  const name = client.trim() || 'Subject';
  const claims: ContentPackageClaim[] = [];
  const sources: Array<{ url: string; label?: string }> = [];
  const milestones: string[] = [];
  const accomplishments: string[] = [];
  const currentWork: string[] = [];
  const organizations: string[] = [];
  const seenSource = new Set<string>();

  const addSource = (url: string | undefined, label?: string) => {
    const cleaned = str(url);
    if (!cleaned || !/^https?:\/\//i.test(cleaned)) return;
    const key = cleaned.toLowerCase();
    if (seenSource.has(key)) return;
    seenSource.add(key);
    sources.push({ url: cleaned, label });
  };

  const addClaim = (
    text: string | undefined,
    status: ContentPackageClaim['status'],
    sourceUrl?: string,
  ) => {
    const cleaned = scrubForbiddenPublicCopy(text);
    if (!cleaned || cleaned.length < 8) return;
    if (!isEvidenceRelevantToSubject(name, cleaned, sourceUrl)) return;
    if (claims.some((c) => c.text.toLowerCase() === cleaned.toLowerCase())) return;
    claims.push({ text: cleaned, status, sourceUrl });
  };

  if (context) {
    const website = listArtifacts(context, 'website').at(-1);
    const websiteData = asRecord(website?.data) || {};
    const extracted = asRecord(websiteData.extracted) || {};
    addSource(str(websiteData.url), str(extracted.title) || 'Website');
    addClaim(str(extracted.title), 'verified', str(websiteData.url));
    addClaim(str(extracted.description), 'verified', str(websiteData.url));
    addClaim(str(extracted.textPreview)?.slice(0, 280), 'inferred', str(websiteData.url));
    for (const h1 of Array.isArray(extracted.h1) ? extracted.h1 : []) {
      addClaim(str(h1), 'verified', str(websiteData.url));
    }

    const branding = listArtifacts(context, 'branding').at(-1);
    const brandingData = asRecord(branding?.data) || {};
    addClaim(str(brandingData.visionSummary), 'inferred', str(brandingData.detectedUrl));
    addClaim(str(brandingData.whatTheyDo), 'inferred', str(brandingData.detectedUrl));
    addClaim(str(brandingData.whoTheyAre), 'inferred', str(brandingData.detectedUrl));
    addSource(str(brandingData.detectedUrl), 'Brand signal');

    const orgProfile = listArtifacts(context, 'organization_profile').at(-1);
    const orgData = asRecord(orgProfile?.data) || {};
    addClaim(str(orgData.websiteDescription), 'verified', str(orgData.primaryUrl));
    addClaim(str(orgData.whoTheyAre), 'inferred', str(orgData.primaryUrl));
    addClaim(str(orgData.whatTheyDo), 'inferred', str(orgData.primaryUrl));
    addClaim(str(orgData.offer), 'inferred', str(orgData.primaryUrl));
    addSource(str(orgData.primaryUrl), 'Organization profile');
    // Never use orgData.goal — that is often the Factory launch goal.

    const prospect = listArtifacts(context, 'prospect_profile').at(-1);
    const prospectData = asRecord(prospect?.data) || {};
    const evidence = Array.isArray(prospectData.evidence) ? prospectData.evidence : [];
    for (const item of evidence.slice(0, 12)) {
      const rec = asRecord(item);
      addClaim(str(rec?.text) || str(item), 'verified', str(rec?.url));
      addSource(str(rec?.url), str(rec?.title));
    }
    const citations = Array.isArray(prospectData.citations) ? prospectData.citations : [];
    for (const item of citations.slice(0, 12)) {
      const rec = asRecord(item);
      addSource(str(rec?.url), str(rec?.title));
    }
    const identity = asRecord(prospectData.identity);
    addSource(str(identity?.selectedUrl), 'Selected identity URL');

    const programs = listArtifacts(context, 'programs').at(-1);
    const programData = asRecord(programs?.data) || {};
    const programItems = Array.isArray(programData.items)
      ? programData.items
      : Array.isArray(programData.programs)
        ? programData.programs
        : [];
    for (const item of programItems.slice(0, 6)) {
      const rec = asRecord(item);
      pushUnique(currentWork, str(rec?.title) || str(rec?.label) || str(item));
    }
  }

  for (const part of extractFromNotes(notes)) {
    addClaim(part, 'admin_clarification');
    // Universal: capture "at/with/for OrgName" without subject-specific org lists.
    const orgMatch = part.match(
      /\b(?:at|with|for)\s+([A-Z][\w&.'-]{0,40}(?:\s+[A-Z0-9][\w&.'-]{0,40}){0,4})\b/,
    );
    if (orgMatch?.[1]) {
      pushUnique(organizations, orgMatch[1].trim());
    }
    if (
      /\b(liaison|director|founder|owner|pastor|minister|nurse|coordinator|clinician|manager|president|ceo|coach|captain)\b/i.test(
        part,
      )
    ) {
      pushUnique(currentWork, part);
    }
    if (/\b(since\s+\d{4}|founded|established|award|milestone)\b/i.test(part)) {
      pushUnique(milestones, part);
      pushUnique(accomplishments, part);
    }
    if (/\b(based in|serves|county|region|headquarters)\b/i.test(part)) {
      pushUnique(currentWork, part);
    }
  }

  // Expand distinguishing detail into atomic role/org claims (generic grammar only).
  const detail = parseDistinguishingDetail(notes);
  if (detail) {
    addClaim(detail, 'admin_clarification');
    const clause = detail.split(/[.;]/)[0]?.trim() || detail;
    const at = clause.match(/^(.+?)\s+at\s+(.+)$/i);
    const withOrg = clause.match(/^(.+?)\s+with\s+(.+)$/i);
    const ofOrg = clause.match(
      /\b(founder|owner|director|president|ceo|captain|coach|minister|pastor)\s+of\s+(.+?)(?:\s+in\s+|\s*$)/i,
    );
    const parsed = at
      ? { role: at[1]!.trim(), org: at[2]!.trim() }
      : withOrg
        ? { role: withOrg[1]!.trim(), org: withOrg[2]!.trim() }
        : ofOrg
          ? { role: ofOrg[1]!.trim(), org: ofOrg[2]!.trim() }
          : null;
    if (parsed?.role) {
      addClaim(
        parsed.org
          ? `${name} serves as ${parsed.role} with ${parsed.org}.`
          : `${name} serves as ${parsed.role}.`,
        'admin_clarification',
      );
      pushUnique(currentWork, parsed.role);
      if (parsed.org) pushUnique(organizations, parsed.org);
    }
    const inPlace = detail.match(/\bin\s+([A-Z][\w\s,]{2,60})(?:\.|$)/);
    if (inPlace?.[1]) {
      pushUnique(currentWork, `Based in ${inPlace[1].trim()}`);
      addClaim(`${name} works from ${inPlace[1].trim()}.`, 'admin_clarification');
    }
  }

  const evidenceModel = buildStructuredEvidenceModel({
    subjectIdentity: name,
    distinguishingDetail: detail || undefined,
    organizations,
    claims,
    sources,
    currentWork,
    milestones,
  });

  const factTexts = claims.map((c) => c.text);
  const roleLine = evidenceModel.verifiedRole;
  const orgLine = evidenceModel.verifiedOrganization || organizations[0] || '';
  const roleOrgFallback = scrubForbiddenPublicCopy(
    [
      roleLine && orgLine ? `${name} — ${roleLine} at ${orgLine}` : '',
      roleLine,
      orgLine && `${name} with ${orgLine}`,
    ].filter(Boolean)[0],
  );
  const positioning =
    scrubForbiddenPublicCopy(
      organizations.length && milestones.length
        ? `${name} — ${milestones[0]}`
        : factTexts[0] || roleOrgFallback,
    ) ||
    roleOrgFallback ||
    `${name} — public profile drafted from verified role and organization signals.`;
  const centralStory =
    scrubForbiddenPublicCopy(
      [
        evidenceModel.subjectFacts[0]?.text || roleLine,
        organizations[0]
          ? roleLine
            ? `${name} works with ${organizations.slice(0, 2).join(' and ')}.`
            : `Organizations include ${organizations.slice(0, 2).join(' and ')}.`
          : '',
        currentWork[0] || '',
      ]
        .filter(Boolean)
        .join(' '),
    ) || positioning;
  const biography =
    scrubForbiddenPublicCopy(
      [
        ...evidenceModel.subjectFacts.slice(0, 3).map((c) => c.text),
        ...factTexts.slice(0, 2),
        ...milestones.slice(0, 2),
      ]
        .filter(Boolean)
        .join(' '),
    ) || centralStory;
  const audience =
    scrubForbiddenPublicCopy(
      claims.find((c) => /audience|community|people|members|players|leaders|patient|famil|customer/i.test(c.text))
        ?.text,
    ) ||
    (/hospice|home\s*health|palliative|patient|clinical\s*care|care\s*coord|liaison/i.test(
      `${biography} ${roleLine || ''} ${orgLine}`,
    )
      ? 'Patients, families, and care partners navigating the next step in clinical support'
      : /product|botanical|retail|shop|sku|collection/i.test(`${biography} ${orgLine}`)
        ? 'Customers looking for trusted products and a clear next purchase step'
        : /nonprofit|ministry|circle|congregation|community\s+org/i.test(`${biography} ${orgLine}`)
          ? 'Members and neighbors seeking belonging, resources, and a clear next step'
          : 'People who want a clear next step with someone they can trust');

  const cinematic = buildLensCopyFromEvidence(evidenceModel, 'cinematic');
  const editorial = buildLensCopyFromEvidence(evidenceModel, 'editorial');
  const intimate = buildLensCopyFromEvidence(evidenceModel, 'intimate');

  // Scrub lens copy (including CTAs — defaults must never ship forbidden slogans)
  for (const lens of [cinematic, editorial, intimate]) {
    lens.heroHeadline = scrubForbiddenPublicCopy(lens.heroHeadline) || `${name}`;
    lens.heroSupporting = scrubForbiddenPublicCopy(lens.heroSupporting) || positioning;
    lens.aboutBody = scrubForbiddenPublicCopy(lens.aboutBody) || biography;
    lens.ctaLabel = scrubForbiddenPublicCopy(lens.ctaLabel) || 'Get started';
    lens.portalPurpose =
      scrubForbiddenPublicCopy(lens.portalPurpose) ||
      'A private workspace that continues after the public story.';
    lens.sectionBodies = lens.sectionBodies
      .map((body) => scrubForbiddenPublicCopy(body) || '')
      .filter(Boolean);
    while (lens.sectionBodies.length < 3) {
      lens.sectionBodies.push(biography);
    }
  }

  const missing: string[] = [];
  const evidence = evaluateEvidenceQuality({
    subjectName: name,
    claims: claims.map((c) => ({
      text: c.text,
      status: c.status,
      sourceUrl: c.sourceUrl,
    })),
    organizations,
    currentWork,
    biography,
    sources,
  });
  if (!evidence.ok) {
    missing.push(...evidence.reasons);
  }
  if (containsForbiddenPublicCopy(centralStory)) {
    missing.push('Central story still contains forbidden copy');
  }

  const ready = missing.length === 0;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    projectId,
    name,
    positioning,
    centralStory,
    biography,
    milestones,
    accomplishments,
    currentWork,
    organizations,
    audience,
    callsToAction: ['Start a conversation', 'Explore the work', 'Begin'],
    mediaPlan: {
      strategy:
        evidence.mode === 'role_org_draft'
          ? 'Role and organization imagery with temporary preview media until subject-owned assets arrive. Never auto-publish unlicensed discovered images.'
          : 'Use verified public media when permitted; otherwise use clearly marked temporary preview media. Never auto-publish unlicensed discovered images.',
      items: [
        {
          label: 'Primary portrait / brand image',
          status: sources.length ? 'planned_from_public_sources' : 'temporary_preview_media',
          source: sources[0]?.url,
        },
        {
          label: 'Supporting story imagery',
          status: 'temporary_preview_media',
        },
      ],
    },
    claims,
    sources,
    lenses: { cinematic, editorial, intimate },
    quality: {
      factCount: claims.length,
      sourceCount: sources.length,
      ready,
      missing,
    },
  };
}

export function readContentPackageFromContext(
  context: ProjectContext,
): ContentPackage | null {
  const outputs = [...(context.outputs || [])]
    .filter((o) => o.worker === CONTENT_PACKAGE_WORKER && o.kind === 'production')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = outputs[outputs.length - 1];
  if (!last?.payload || typeof last.payload !== 'object') return null;
  const payload = last.payload as ContentPackage;
  if (payload.schemaVersion !== 1) return null;
  return payload;
}
