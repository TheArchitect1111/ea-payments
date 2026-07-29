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
    if (!url || !/^https?:\/\//i.test(url)) return;
    if (/\/api\/ctp\/assets\//i.test(url)) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    sources.push({ url, kind, collectedAt, label });
  };

  for (const art of context.artifacts || []) {
    const data = asRecord(art.data) || {};
    push(str(data.url) || str(data.sourceUrl) || str(data.pageUrl), art.kind, art.createdAt, str(data.title));
    push(str(data.primaryUrl), art.kind, art.createdAt);
    const provenance = asRecord(art.provenance);
    push(str(provenance?.sourceUrl), art.kind, art.createdAt);
    const extracted = asRecord(data.extracted);
    push(str(extracted?.canonicalUrl), art.kind, art.createdAt);
  }

  // Research worker outputs may store citations without artifacts.
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

  if (project.url) push(project.url, 'seed', project.createdAt || new Date().toISOString(), 'Launch URL');
  if (context.seed?.url) {
    push(context.seed.url, 'seed', context.createdAt || new Date().toISOString(), 'Seed URL');
  }

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
  const base = (notes || '').trim();
  const without = base
    .split('\n')
    .filter((line) => !/^Distinguishing detail:/i.test(line.trim()))
    .join('\n')
    .trim();
  const parts = [
    `Distinguishing detail: ${clean}`,
    without,
    extraUrl?.trim() ? `Known website/social: ${extraUrl.trim()}` : null,
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
  profileConfidence: string,
): IdentityClaim[] {
  const claims: IdentityClaim[] = [];
  if (!project.context) {
    return [{ text: 'Project context missing.', status: 'unknown' }];
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
      text: `Organization signal: ${orgName}`,
      status: 'verified',
      sourceUrl: str(orgData.url) || sources[0]?.url,
    });
  }

  claims.push({
    text: `Entity profile confidence: ${profileConfidence}`,
    status: profileConfidence === 'thin' ? 'unknown' : 'inferred',
  });

  if (!claims.length) {
    claims.push({ text: 'Identity evidence is incomplete.', status: 'unknown' });
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
      claims: [{ text: 'Project context missing.', status: 'unknown' }],
      candidates: [project.client],
      reason: 'Project context is missing, so identity cannot be verified.',
      resumeHint: 'Add a website URL or one more identifying detail, then resume.',
    };
  }

  const sources = collectSources(context, project);
  const detail = parseDistinguishingDetail(project.notes || context.seed?.notes);
  const candidates = extractCandidateNames(context, project.client);
  const profile = buildFactoryEntityProfileSync(project);
  const bundle = collectEntitySignalBundle(project);
  const claims = buildClaims(project, sources, profile.confidence);

  const ambiguousListed = candidates.filter(
    (name) => name.trim().toLowerCase() !== project.client.trim().toLowerCase(),
  );

  // Explicit multi-identity stop: 2+ alternate candidates without strong confirmation.
  if (ambiguousListed.length >= 2 && !(sources.length >= 1 && detail)) {
    return {
      ok: false,
      code: 'ambiguous',
      confidence: 'thin',
      resolvedName: project.client,
      sources,
      claims,
      candidates: [project.client, ...ambiguousListed].slice(0, 6),
      reason: `Multiple plausible identities remain (${ambiguousListed.slice(0, 3).join(', ')}). Concepts were not generated.`,
      resumeHint: 'Add one clearer identifying detail (city, role, official site) and resume.',
    };
  }

  // Research output can mark identity ambiguous explicitly.
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
        candidates: [project.client, ...ambiguousListed].slice(0, 6),
        reason:
          str(identity.reason) ||
          'Research left more than one plausible identity. Concepts were not generated.',
        resumeHint: 'Provide one additional identifying detail and resume.',
      };
    }
  }

  const credibleSource = sources.length >= 1;
  const hasDetail = Boolean(detail && detail.length > 3);
  const hasWebsiteSignal = Boolean(bundle.hasWebsite || bundle.websiteTitle);
  const hasBrandingSignal = Boolean(bundle.hasPhoto || bundle.visionSummary || bundle.whatTheyDo);

  if (profile.confidence === 'thin' && !credibleSource && !hasDetail) {
    return {
      ok: false,
      code: 'thin_identity',
      confidence: 'thin',
      resolvedName: project.client,
      sources,
      claims,
      candidates: [project.client],
      reason: 'Identity confidence is too thin to generate public concepts safely.',
      resumeHint: 'Add one distinguishing detail and optionally a known URL, then resume.',
    };
  }

  if (!credibleSource && !hasWebsiteSignal && !hasBrandingSignal && !hasDetail) {
    return {
      ok: false,
      code: 'insufficient_evidence',
      confidence: 'thin',
      resolvedName: project.client,
      sources,
      claims,
      candidates: [project.client, ...ambiguousListed].slice(0, 6),
      reason:
        'Research did not find a credible supporting source URL or usable website/branding signal for this name.',
      resumeHint: 'Provide an official website or social URL (or a sharper distinguishing detail) and resume.',
    };
  }

  // Require at least one credible source OR (detail + research signal) for launch safety.
  if (!credibleSource && !(hasDetail && (hasWebsiteSignal || hasBrandingSignal))) {
    return {
      ok: false,
      code: 'insufficient_evidence',
      confidence: 'thin',
      resolvedName: project.client,
      sources,
      claims,
      candidates: [project.client],
      reason: 'Need at least one credible source URL, or a distinguishing detail plus research signal.',
      resumeHint: 'Add an official URL or one clearer identifying detail, then resume.',
    };
  }

  const confidence: 'high' | 'medium' =
    profile.confidence === 'high' || (credibleSource && (hasWebsiteSignal || hasDetail))
      ? 'high'
      : 'medium';

  return {
    ok: true,
    confidence,
    resolvedName: profile.name || project.client,
    sources,
    claims,
    reason:
      confidence === 'high'
        ? 'Identity resolved with at least one credible source and supporting research signals.'
        : 'Identity resolved with enough evidence to proceed to concept review.',
  };
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
