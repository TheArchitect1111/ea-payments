/**
 * Minimum identity safety gate for Universal Experience Generator launch.
 * Stops concept generation when research cannot resolve a single credible subject.
 * Reuses existing research/entity signals — no Firecrawl or new crawl stack.
 */
import {
  buildFactoryEntityProfileSync,
  collectEntitySignalBundle,
} from '@/lib/factory-entity-profile';
import { listArtifacts, type Artifact } from '@/lib/factory-artifact';
import {
  projectContextFromProject,
  type ProjectContext,
} from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';
import {
  extractFirstUrlFromText,
  extractUrlFromLaunchNotes,
  normalizeLaunchUrl,
} from '@/lib/factory-url-normalize.mjs';

export type IdentitySource = {
  url: string;
  kind: string;
  collectedAt: string;
  label?: string;
};

export type IdentityClaim = {
  text: string;
  status: 'verified' | 'inferred' | 'unknown';
  sourceUrl?: string;
};

export type IdentityGateResult =
  | {
      ok: true;
      confidence: 'high' | 'medium';
      resolvedName: string;
      sources: IdentitySource[];
      claims: IdentityClaim[];
      reason: string;
    }
  | {
      ok: false;
      code: 'ambiguous' | 'insufficient_evidence' | 'thin_identity';
      confidence: 'thin' | 'medium';
      resolvedName: string;
      sources: IdentitySource[];
      claims: IdentityClaim[];
      candidates: string[];
      reason: string;
      resumeHint: string;
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function latest(context: ProjectContext, kind: Artifact['kind']): Artifact | null {
  const rows = listArtifacts(context, kind);
  return rows.length ? rows[rows.length - 1]! : null;
}

function collectSources(context: ProjectContext, project: FactoryProject): IdentitySource[] {
  const sources: IdentitySource[] = [];
  const seen = new Set<string>();

  const push = (url: string | undefined, kind: string, collectedAt: string, label?: string) => {
    const normalized = normalizeLaunchUrl(url);
    if (!normalized) return;
    if (/\/api\/ctp\/assets\//i.test(normalized)) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sources.push({ url: normalized, kind, collectedAt, label });
  };

  for (const art of context.artifacts || []) {
    const data = asRecord(art.data) || {};
    push(str(data.url) || str(data.sourceUrl) || str(data.pageUrl), art.kind, art.createdAt, str(data.title));
    push(str(data.primaryUrl), art.kind, art.createdAt);
    push(str(data.selectedUrl), art.kind, art.createdAt);
    const identity = asRecord(data.identity);
    push(str(identity?.selectedUrl), art.kind, art.createdAt);
    const provenance = asRecord(art.provenance);
    push(str(provenance?.sourceUrl), art.kind, art.createdAt);
    const extracted = asRecord(data.extracted);
    push(str(extracted?.canonicalUrl), art.kind, art.createdAt);
  }

  for (const out of context.outputs || []) {
    if (out.kind !== 'research') continue;
    const payload = asRecord(out.payload) || {};
    push(str(payload.sourceUrl) || str(payload.url), 'research-output', out.createdAt);
    const citations = payload.citations || payload.sources;
    if (Array.isArray(citations)) {
      for (const item of citations) {
        const rec = asRecord(item);
        push(str(rec?.url) || str(item), 'research-citation', out.createdAt, str(rec?.title));
      }
    }
  }

  const notes = project.notes || context.seed?.notes;
  push(project.url, 'seed', project.createdAt || new Date().toISOString(), 'Official website');
  push(context.seed?.url, 'seed', context.createdAt || new Date().toISOString(), 'Official website');
  push(
    extractUrlFromLaunchNotes(notes),
    'seed-notes',
    project.createdAt || new Date().toISOString(),
    'From launch notes',
  );
  push(
    extractFirstUrlFromText(parseDistinguishingDetail(notes)),
    'seed-detail',
    project.createdAt || new Date().toISOString(),
    'From identifying detail',
  );

  return sources;
}

export function parseDistinguishingDetail(notes: string | undefined): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/Distinguishing detail:\s*(.+)/i);
  return match?.[1]?.split('\n')[0]?.trim() || undefined;
}

/**
 * Append or replace distinguishing detail on project notes (admin resume path).
 */
export function mergeDistinguishingDetail(
  notes: string | undefined,
  detail: string,
  extraUrl?: string,
): string {
  const clean = detail.trim();
  const normalizedUrl = normalizeLaunchUrl(extraUrl);
  const base = (notes || '').trim();
  const without = base
    .split('\n')
    .filter((line) => !/^Distinguishing detail:/i.test(line.trim()))
    .join('\n')
    .trim();
  const parts = [
    clean ? `Distinguishing detail: ${clean}` : null,
    without,
    normalizedUrl ? `Known website/social: ${normalizedUrl}` : null,
    'Identity resume: administrator clarified subject',
  ].filter(Boolean);
  return parts.join('\n');
}

function extractCandidateNames(context: ProjectContext, client: string): string[] {
  const names = new Set<string>();
  const clientNorm = client.trim().toLowerCase();
  if (client.trim()) names.add(client.trim());

  for (const art of context.artifacts || []) {
    const data = asRecord(art.data) || {};
    const candidates = data.identityCandidates || data.candidates || data.plausibleIdentities;
    if (Array.isArray(candidates)) {
      for (const item of candidates) {
        const rec = asRecord(item);
        const name = str(rec?.name) || str(item);
        if (name) names.add(name);
      }
    }
    const alt = str(data.alternateName) || str(data.suggestedClientName) || str(data.brandName);
    if (alt) names.add(alt);
  }

  for (const out of context.outputs || []) {
    if (out.kind !== 'research') continue;
    const payload = asRecord(out.payload) || {};
    const candidates = payload.identityCandidates || payload.candidates;
    if (Array.isArray(candidates)) {
      for (const item of candidates) {
        const rec = asRecord(item);
        const name = str(rec?.name) || str(item);
        if (name) names.add(name);
      }
    }
    const identity = asRecord(payload.identity);
    if (identity && identity.status === 'ambiguous' && Array.isArray(identity.candidates)) {
      for (const item of identity.candidates) {
        const rec = asRecord(item);
        const name = str(rec?.name) || str(item);
        if (name) names.add(name);
      }
    }
  }

  return [...names].filter((n) => n.trim().toLowerCase() !== clientNorm || n === client);
}

function buildClaims(
  project: FactoryProject,
  sources: IdentitySource[],
): IdentityClaim[] {
  const claims: IdentityClaim[] = [];
  if (!project.context) {
    return [{ text: 'We could not load this launch yet.', status: 'unknown' }];
  }
  const context = projectContextFromProject(project);

  const website = latest(context, 'website');
  const branding = latest(context, 'branding');
  const org = latest(context, 'organization');
  const websiteData = asRecord(website?.data) || {};
  const extracted = asRecord(websiteData.extracted) || {};
  const title = str(extracted.title) || str(websiteData.title);
  if (title) {
    claims.push({
      text: `Website title: ${title}`,
      status: sources.length ? 'verified' : 'inferred',
      sourceUrl: sources[0]?.url,
    });
  }

  const brandingData = asRecord(branding?.data) || {};
  const summary = str(brandingData.visionSummary) || str(brandingData.whatTheyDo);
  if (summary) {
    claims.push({
      text: summary.slice(0, 240),
      status: brandingData.hasVision ? 'inferred' : 'unknown',
      sourceUrl: str(brandingData.detectedUrl) || sources[0]?.url,
    });
  }

  const orgData = asRecord(org?.data) || {};
  const orgName = str(orgData.name) || str(orgData.legalName) || str(orgData.organizationName);
  if (orgName) {
    claims.push({
      text: `Organization: ${orgName}`,
      status: 'verified',
      sourceUrl: str(orgData.url) || sources[0]?.url,
    });
  }

  if (sources[0]?.url) {
    claims.push({
      text: `Official site: ${sources[0].url}`,
      status: 'verified',
      sourceUrl: sources[0].url,
    });
  }

  if (!claims.length) {
    claims.push({ text: 'Public evidence is still incomplete.', status: 'unknown' });
  }

  return claims;
}

/**
 * Evaluate whether the project has enough resolved identity to generate concepts.
 */
export function evaluateIdentityGate(project: FactoryProject): IdentityGateResult {
  const context = project.context ? projectContextFromProject(project) : null;
  if (!context) {
    return {
      ok: false,
      code: 'insufficient_evidence',
      confidence: 'thin',
      resolvedName: project.client,
      sources: [],
      claims: [{ text: 'We could not load this launch yet.', status: 'unknown' }],
      candidates: [project.client],
      reason: 'This launch is not ready to verify yet.',
      resumeHint: 'What city, profession, team, company, or organization is this connected to?',
    };
  }

  const sources = collectSources(context, project);
  const detail = parseDistinguishingDetail(project.notes || context.seed?.notes);
  const candidates = extractCandidateNames(context, project.client);
  const profile = buildFactoryEntityProfileSync(project);
  const bundle = collectEntitySignalBundle(project);
  const claims = buildClaims(project, sources);

  const ambiguousListed = candidates.filter(
    (name) => name.trim().toLowerCase() !== project.client.trim().toLowerCase(),
  );

  // Explicit multi-identity stop: 2+ alternate candidates without strong confirmation.
  if (ambiguousListed.length >= 2 && !(sources.length >= 1)) {
    return {
      ok: false,
      code: 'ambiguous',
      confidence: 'thin',
      resolvedName: project.client,
      sources,
      claims,
      candidates: [project.client, ...ambiguousListed].slice(0, 3),
      reason: 'We found more than one possible match. Which one did you mean?',
      resumeHint: 'Select the correct person or organization to continue.',
    };
  }

  for (const out of context.outputs || []) {
    const payload = asRecord(out.payload) || {};
    const identity = asRecord(payload.identity);
    if (identity?.status === 'ambiguous') {
      return {
        ok: false,
        code: 'ambiguous',
        confidence: 'thin',
        resolvedName: project.client,
        sources,
        claims,
        candidates: [project.client, ...ambiguousListed].slice(0, 3),
        reason:
          str(identity.reason) ||
          'We found more than one possible match. Which one did you mean?',
        resumeHint: 'Select the correct person or organization to continue.',
      };
    }
  }

  // Sticky pass: a prior successful identity-gate output for this subject remains valid.
  const priorGate = readLatestSuccessfulIdentityGateOutput(context);
  if (priorGate?.ok === true && str(priorGate.resolvedName)) {
    return {
      ok: true,
      confidence:
        priorGate.confidence === 'high' || priorGate.confidence === 'medium'
          ? (priorGate.confidence as 'high' | 'medium')
          : 'medium',
      resolvedName: String(priorGate.resolvedName),
      sources:
        Array.isArray(priorGate.sources) && priorGate.sources.length
          ? (priorGate.sources as IdentitySource[])
          : sources,
      claims:
        Array.isArray(priorGate.claims) && priorGate.claims.length
          ? (priorGate.claims as IdentityClaim[])
          : claims,
      reason:
        str(priorGate.reason) ||
        'Identity reused from a previously confirmed resolution for this project.',
    };
  }

  const credibleSource = sources.length >= 1;
  const hasDetail = Boolean(detail && detail.length > 3);
  const hasWebsiteSignal = Boolean(bundle.hasWebsite || bundle.websiteTitle);
  const hasBrandingSignal = Boolean(bundle.hasPhoto || bundle.visionSummary || bundle.whatTheyDo);

  // Official / discovered URL is enough — do not make the administrator re-do research.
  if (credibleSource) {
    const confidence: 'high' | 'medium' =
      profile.confidence === 'high' || hasWebsiteSignal || hasBrandingSignal || hasDetail
        ? 'high'
        : 'medium';
    return {
      ok: true,
      confidence,
      resolvedName: profile.name || project.client,
      sources,
      claims,
      reason: 'Identity resolved from a credible public website or source.',
    };
  }

  if (hasWebsiteSignal || hasBrandingSignal) {
    return {
      ok: true,
      confidence: 'medium',
      resolvedName: profile.name || project.client,
      sources,
      claims,
      reason: 'Identity resolved from researched website and brand signals.',
    };
  }

  if (hasDetail) {
    return {
      ok: true,
      confidence: 'medium',
      resolvedName: profile.name || project.client,
      sources,
      claims,
      reason: 'Identity proceeding with the clarifying detail you provided.',
    };
  }

  return {
    ok: false,
    code: 'thin_identity',
    confidence: 'thin',
    resolvedName: project.client,
    sources,
    claims,
    candidates: [project.client],
    reason: 'We could not confirm who this is from the name alone.',
    resumeHint: 'What city, profession, team, company, or organization is this connected to?',
  };
}

/** Latest successful identity-gate payload from ProjectContext outputs (if any). */
export function readLatestSuccessfulIdentityGateOutput(
  context: ProjectContext | null | undefined,
): Record<string, unknown> | null {
  if (!context?.outputs?.length) return null;
  const rows = [...context.outputs]
    .filter((o) => o.worker === 'identity-gate' && o.kind === 'research')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const payload = rows[i]?.payload;
    if (payload && typeof payload === 'object' && (payload as { ok?: boolean }).ok === true) {
      return payload as Record<string, unknown>;
    }
  }
  return null;
}

/** Latest identity-gate payload from ProjectContext outputs (if any). */
export function readLatestIdentityGateOutput(
  context: ProjectContext | null | undefined,
): Record<string, unknown> | null {
  if (!context?.outputs?.length) return null;
  const rows = [...context.outputs]
    .filter((o) => o.worker === 'identity-gate' && o.kind === 'research')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = rows[rows.length - 1];
  return last?.payload && typeof last.payload === 'object'
    ? (last.payload as Record<string, unknown>)
    : null;
}
