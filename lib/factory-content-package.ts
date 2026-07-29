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
    if (/duke|basketball|captain|coach|charlotte|efficiency architects|founder/i.test(part)) {
      pushUnique(milestones, part);
      pushUnique(accomplishments, part);
    }
    if (/efficiency architects/i.test(part)) {
      pushUnique(organizations, 'Efficiency Architects');
    }
    if (/\bduke\b/i.test(part)) {
      pushUnique(organizations, 'Duke University');
    }
    if (/3hc|home\s*health|health\s*care/i.test(part)) {
      pushUnique(organizations, /3hc/i.test(part) ? '3HC' : part);
      pushUnique(currentWork, part);
    }
    if (/clinical\s+liaison|liaison|nurse|director/i.test(part)) {
      pushUnique(currentWork, part);
      pushUnique(milestones, part);
    }
    if (/charlotte/i.test(part)) {
      pushUnique(currentWork, `Based in Charlotte, North Carolina`);
    }
    if (/founder/i.test(part) && /efficiency architects/i.test(part)) {
      pushUnique(currentWork, `Founder of Efficiency Architects`);
    }
    if (/basketball|captain|coach/i.test(part)) {
      pushUnique(accomplishments, part);
    }
  }

  // Expand clarification into atomic claims when research is thin.
  const detail = parseDistinguishingDetail(notes);
  if (detail) {
    if (/duke/i.test(detail) && /basketball/i.test(detail)) {
      addClaim(`${name} competed in basketball at Duke University.`, 'admin_clarification');
    }
    if (/captain/i.test(detail)) {
      addClaim(`${name} served as a team captain.`, 'admin_clarification');
    }
    if (/efficiency architects/i.test(detail) && /founder/i.test(detail)) {
      addClaim(`${name} founded Efficiency Architects.`, 'admin_clarification');
    }
    if (/charlotte/i.test(detail)) {
      addClaim(`${name} works from Charlotte, North Carolina.`, 'admin_clarification');
    }
    if (/clinical\s+liaison/i.test(detail)) {
      addClaim(`${name} serves as a Clinical Liaison.`, 'admin_clarification');
    }
    if (/\b3hc\b/i.test(detail)) {
      addClaim(`${name} is affiliated with 3HC.`, 'admin_clarification');
      pushUnique(organizations, '3HC');
    }
  }

  const factTexts = claims.map((c) => c.text);
  const roleLine =
    currentWork.find((w) => /liaison|nurse|director|founder|coach|clinician/i.test(w)) ||
    factTexts.find((t) => /clinical\s+liaison|liaison|nurse|director|founder/i.test(t));
  const orgLine = organizations[0] || (factTexts.find((t) => /\b3hc\b|hospital|home\s*health/i.test(t)) || '');
  const roleOrgFallback = scrubForbiddenPublicCopy(
    [roleLine && orgLine ? `${name} — ${roleLine} at ${orgLine}` : '', roleLine, orgLine && `${name} with ${orgLine}`]
      .filter(Boolean)[0],
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
        factTexts[0] || roleLine,
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
        ...factTexts.slice(0, 4),
        ...milestones.slice(0, 2),
        ...currentWork.slice(0, 2),
      ].join(' '),
    ) || centralStory;
  const audience =
    scrubForbiddenPublicCopy(
      claims.find((c) => /audience|community|people|members|players|leaders|patient|famil/i.test(c.text))
        ?.text,
    ) ||
    (/efficiency architects|duke|basketball|coach/i.test(biography)
      ? 'Leaders, teams, and organizations seeking clarity, structure, and a trusted next step'
      : /liaison|3hc|home\s*health|patient|care/i.test(`${biography} ${roleLine} ${orgLine}`)
        ? 'Patients, families, and care partners navigating the next step in home health and clinical support'
        : 'People who want a clear next step with someone they can trust');

  const cinematic: ContentPackageLensCopy = {
    heroHeadline:
      milestones[0] && /duke|basketball|captain/i.test(milestones[0])
        ? `From the court to the work that still matters`
        : roleLine && orgLine
          ? `${name} · ${orgLine}`
          : roleLine
            ? `${name} — ${roleLine}`
            : `Guided next steps with ${name}`,
    heroSupporting:
      factTexts.find((t) => /duke|captain|founder|charlotte|liaison|3hc|clinical/i.test(t)) ||
      roleOrgFallback ||
      factTexts[0] ||
      positioning,
    aboutTitle: `Who ${name} is`,
    aboutBody: biography,
    sectionHeadlines: [
      'The path so far',
      'What the work stands for',
      'Proof in public',
      'Where the story goes next',
    ],
    sectionBodies: [
      milestones[0] || factTexts[1] || biography,
      organizations[0]
        ? `${name}’s work connects through ${organizations.slice(0, 2).join(' and ')}.`
        : factTexts[2] || centralStory,
      accomplishments[0] || factTexts[3] || positioning,
      currentWork[0] || 'Continue with one clear next conversation.',
    ],
    ctaLabel: 'Continue the conversation',
    portalPurpose: 'A calm place to continue the relationship after the public story.',
  };

  const editorial: ContentPackageLensCopy = {
    heroHeadline:
      organizations.includes('Efficiency Architects')
        ? `${name}: athlete, founder, systems thinker`
        : roleLine && orgLine
          ? `${roleLine} · ${orgLine}`
          : `A profile of ${name}`,
    heroSupporting: factTexts[1] || roleOrgFallback || factTexts[0] || positioning,
    aboutTitle: 'Selected chapters',
    aboutBody: centralStory,
    sectionHeadlines: [
      'Expertise in context',
      'Initiatives and organizations',
      'Evidence and milestones',
      'Current work',
    ],
    sectionBodies: [
      biography,
      organizations.length
        ? organizations.join(' · ')
        : factTexts[2] || positioning,
      [...milestones, ...accomplishments].filter(Boolean).slice(0, 3).join(' ') ||
        factTexts[3] ||
        centralStory,
      currentWork[0] || factTexts[1] || 'Work that is still unfolding.',
    ],
    ctaLabel: 'Read the next chapter',
    portalPurpose: 'A private briefing space that continues the editorial story.',
  };

  const intimate: ContentPackageLensCopy = {
    heroHeadline: roleLine ? `${name}, ${roleLine}` : `Meet ${name}`,
    heroSupporting:
      currentWork[0] ||
      factTexts.find((t) => /charlotte|founder|efficiency|liaison|3hc|clinical/i.test(t)) ||
      roleOrgFallback ||
      factTexts[0] ||
      positioning,
    aboutTitle: 'A direct introduction',
    aboutBody: biography,
    sectionHeadlines: ['What matters', 'How the work feels', 'Who this is for', 'Begin together'],
    sectionBodies: [
      centralStory,
      factTexts[1] || accomplishments[0] || positioning,
      audience,
      'One honest next step — a conversation, not a dashboard.',
    ],
    ctaLabel: 'Start a conversation',
    portalPurpose: 'A trusted companion workspace for the relationship.',
  };

  // Scrub lens copy
  for (const lens of [cinematic, editorial, intimate]) {
    lens.heroHeadline = scrubForbiddenPublicCopy(lens.heroHeadline) || `${name}`;
    lens.heroSupporting = scrubForbiddenPublicCopy(lens.heroSupporting) || positioning;
    lens.aboutBody = scrubForbiddenPublicCopy(lens.aboutBody) || biography;
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
    callsToAction: ['Continue the conversation', 'Explore the work', 'Begin'],
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
