/**
 * Shared org research bundle for Opportunity Intelligence Brief™ + concept renders.
 * Photo + website + notes; optional single public page when a social/GBP URL is found.
 */
import {
  collectEntitySignalBundle,
  type EntitySignalBundle,
  type FactoryEntityProfile,
} from '@/lib/factory-entity-profile';
import {
  industryFamilyFromText,
  memberPersonaForFamily,
  memberTilesForPersona,
  parseHexColor,
  portalModulesForFamily,
  premiumPaletteForName,
} from '@/lib/factory-opportunity-brief-parse.mjs';
import type { FactoryProject } from '@/lib/factory-project-store';

export type FactoryEvidenceItem = {
  label: string;
  detail: string;
  kind?: 'photo' | 'website' | 'social' | 'notes' | 'vision';
};

export type FactoryOrgResearch = {
  name: string;
  story: string;
  industry?: string;
  industryFamily: string;
  primaryAudience: string;
  offer: string;
  whoTheyAre?: string;
  digitalMaturity?: number;
  confidence: 'high' | 'medium' | 'thin';
  hasPhoto: boolean;
  hasWebsite: boolean;
  hasNotes: boolean;
  websiteTitle?: string;
  h1: string[];
  frictionHints: string[];
  brand: {
    primary: string;
    accent: string;
    logoUrl?: string;
    headline?: string;
    subhead?: string;
    cta?: string;
    photographyHint?: string;
  };
  evidence: FactoryEvidenceItem[];
  portalModules: string[];
  memberPersona: string;
  memberTiles: string[];
  /** Optional single public page excerpt (FB / IG / GBP / LinkedIn). */
  publicPage?: {
    url: string;
    network: string;
    excerpt?: string;
  };
  sourceNote: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const SOCIAL_RE =
  /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com|instagram\.com|linkedin\.com\/(?:company|in)|google\.com\/maps|g\.page|business\.google\.com)[^\s"'<>)]+/gi;

export function detectPublicSocialUrl(blob: string): { url: string; network: string } | undefined {
  const matches = String(blob || '').match(SOCIAL_RE);
  if (!matches?.length) return undefined;
  const url = matches[0].replace(/[.,;)]+$/, '');
  let network = 'public page';
  if (/facebook|fb\.com/i.test(url)) network = 'Facebook';
  else if (/instagram/i.test(url)) network = 'Instagram';
  else if (/linkedin/i.test(url)) network = 'LinkedIn';
  else if (/google|g\.page/i.test(url)) network = 'Google Business';
  return { url, network };
}

async function fetchPublicPageExcerpt(
  url: string,
): Promise<{ excerpt?: string; title?: string } | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EfficiencyArchitects-LaunchResearch/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const html = (await res.text()).slice(0, 80_000);
    const title =
      html.match(/<title[^>]*>([^<]{3,120})<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ||
      html.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1]?.trim();
    const desc =
      html.match(/property=["']og:description["'][^>]*content=["']([^"']+)/i)?.[1]?.trim() ||
      html.match(/name=["']description["'][^>]*content=["']([^"']+)/i)?.[1]?.trim();
    const textBits = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 400);
    const excerpt = [desc, textBits].filter(Boolean).join(' — ').slice(0, 420) || undefined;
    return { excerpt, title };
  } catch {
    return undefined;
  }
}

function collectBrandColors(project: FactoryProject): { primary?: string; accent?: string } {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  const data = branding?.data || {};
  return {
    primary: str(data.primaryColor),
    accent: str(data.accentColor),
  };
}

function logoFromProject(project: FactoryProject, extracted: Record<string, unknown>): string | undefined {
  return (
    str(extracted.ogImage) ||
    (project.attachments || []).find((a) => a.type === 'image' && a.url?.startsWith('http'))?.url
  );
}

/**
 * Sync research from existing Launch artifacts (no network).
 */
export function buildFactoryOrgResearchSync(
  project: FactoryProject,
  profile?: FactoryEntityProfile,
): FactoryOrgResearch {
  const bundle = collectEntitySignalBundle(project);
  return researchFromBundle(project, bundle, profile);
}

function researchFromBundle(
  project: FactoryProject,
  bundle: EntitySignalBundle,
  profile?: FactoryEntityProfile,
  publicPage?: FactoryOrgResearch['publicPage'],
): FactoryOrgResearch {
  const artifacts = project.context?.artifacts || [];
  const website = [...artifacts].reverse().find((a) => a.kind === 'website');
  const extracted = asRecord(asRecord(website?.data)?.extracted) || {};
  const colors = collectBrandColors(project);
  const name = profile?.name || bundle.name || project.client;
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  const family = industryFamilyFromText(
    [
      bundle.entityTypeHint,
      str(branding?.data?.industry),
      project.industry,
      profile?.whoTheyServe,
      profile?.whatTheyOffer,
      profile?.whoTheyAre,
      bundle.audience,
      bundle.whatTheyDo,
      bundle.notes,
      name,
    ]
      .filter(Boolean)
      .join(' '),
  );
  const palette = premiumPaletteForName(name);
  const primary = parseHexColor(colors.primary, palette.primary);
  const accent = parseHexColor(colors.accent, palette.accent);
  const audience =
    profile?.whoTheyServe || bundle.audience || 'the people this organization serves';
  const offer = profile?.whatTheyOffer || bundle.offerHint || bundle.whatTheyDo || 'programs and relationships';
  const story = `We help ${audience}.`;
  const persona = memberPersonaForFamily(family);
  const modules = portalModulesForFamily(family);
  const tiles = memberTilesForPersona(persona);

  const signalCount = [bundle.hasPhoto, bundle.hasWebsite, bundle.hasNotes, Boolean(publicPage)].filter(
    Boolean,
  ).length;
  const confidence: FactoryOrgResearch['confidence'] =
    profile?.confidence ||
    (signalCount >= 3 ? 'high' : signalCount === 1 && bundle.hasPhoto && !bundle.hasWebsite ? 'thin' : 'medium');

  const evidence: FactoryEvidenceItem[] = [];
  if (bundle.hasPhoto) {
    evidence.push({
      label: 'Launch photo',
      detail: 'Visual brand signal captured at phone Launch.',
      kind: 'photo',
    });
  }
  if (bundle.websiteTitle) {
    evidence.push({ label: 'Homepage title', detail: bundle.websiteTitle, kind: 'website' });
  }
  if (bundle.h1[0]) {
    evidence.push({ label: 'Homepage H1', detail: bundle.h1[0], kind: 'website' });
  }
  if (bundle.websiteDescription) {
    evidence.push({
      label: 'Meta description',
      detail: bundle.websiteDescription.slice(0, 180),
      kind: 'website',
    });
  }
  if (str(extracted.ogImage)) {
    evidence.push({ label: 'OG image', detail: 'Public share image detected on homepage.', kind: 'website' });
  }
  if (publicPage?.excerpt) {
    evidence.push({
      label: `${publicPage.network} page`,
      detail: publicPage.excerpt.slice(0, 200),
      kind: 'social',
    });
  } else if (publicPage) {
    evidence.push({
      label: `${publicPage.network} URL`,
      detail: publicPage.url,
      kind: 'social',
    });
  }
  if (bundle.hasNotes && project.notes?.trim()) {
    evidence.push({
      label: 'Launch notes',
      detail: project.notes.trim().slice(0, 160),
      kind: 'notes',
    });
  }
  for (const e of profile?.evidence || []) {
    if (evidence.length >= 6) break;
    if (!evidence.some((item) => item.detail === e)) {
      evidence.push({ label: 'Signal', detail: e, kind: 'vision' });
    }
  }

  return {
    name,
    story,
    industry: family === 'nonprofit' ? 'Community nonprofit' : family,
    industryFamily: family,
    primaryAudience: audience,
    offer,
    whoTheyAre: profile?.whoTheyAre,
    confidence,
    hasPhoto: bundle.hasPhoto,
    hasWebsite: bundle.hasWebsite,
    hasNotes: bundle.hasNotes,
    websiteTitle: bundle.websiteTitle,
    h1: bundle.h1,
    frictionHints: (profile?.frictionSignals?.length
      ? profile.frictionSignals
      : bundle.frictionHints
    ).slice(0, 8),
    brand: {
      primary,
      accent,
      logoUrl: logoFromProject(project, extracted),
      headline: bundle.h1[0] || bundle.websiteTitle || story,
      subhead: (bundle.websiteDescription || profile?.whatTheyOffer || offer).slice(0, 160),
      cta: profile?.primaryAsk || bundle.cta || bundle.ctas[0] || 'Get started',
      photographyHint: bundle.hasPhoto ? 'Use launch photo atmosphere in hero treatments.' : undefined,
    },
    evidence: evidence.slice(0, 6),
    portalModules: modules,
    memberPersona: persona,
    memberTiles: tiles,
    publicPage,
    sourceNote: bundle.sourceNote,
  };
}

/**
 * Async research — adds one public page fetch when a social/GBP URL is detected.
 */
export async function buildFactoryOrgResearch(
  project: FactoryProject,
  profile?: FactoryEntityProfile,
): Promise<FactoryOrgResearch> {
  const bundle = collectEntitySignalBundle(project);
  const blob = [
    project.notes,
    project.goal,
    project.url,
    bundle.websiteTextPreview,
    bundle.visionText,
    bundle.visionSummary,
    ...(bundle.navLabels || []),
  ]
    .filter(Boolean)
    .join('\n');

  const detected = detectPublicSocialUrl(blob);
  let publicPage: FactoryOrgResearch['publicPage'];
  if (detected) {
    const fetched = await fetchPublicPageExcerpt(detected.url);
    publicPage = {
      url: detected.url,
      network: detected.network,
      excerpt: fetched?.excerpt || fetched?.title,
    };
  }

  return researchFromBundle(project, bundle, profile, publicPage);
}
