/**
 * Entity understanding for Factory Concept Pack — person / business / org.
 * Synthesizes research signals into a sit-down briefing profile.
 */
import { callClaudeText } from '@/lib/ai';
import {
  buildEntityProfileFallback as buildFallback,
  parseEntityProfileLabeledText as parseLabeled,
} from '@/lib/factory-entity-profile-parse.mjs';
import type { FactoryProject } from '@/lib/factory-project-store';

export type FactoryEntityType = 'person' | 'business' | 'organization' | 'unknown';

export type FactoryEntityProfile = {
  entityType: FactoryEntityType;
  name: string;
  tagline?: string;
  whoTheyAre: string;
  whoTheyServe?: string;
  whatTheyOffer?: string;
  howTheySound?: string;
  proofSignals: string[];
  frictionSignals: string[];
  opsReality?: string;
  primaryAsk?: string;
  evidence: string[];
  confidence: 'high' | 'medium' | 'thin';
  sourceNote: string;
};

export type EntitySignalBundle = {
  name: string;
  sourceNote: string;
  hasPhoto: boolean;
  hasWebsite: boolean;
  hasNotes: boolean;
  visionSummary?: string;
  visionText?: string;
  whatTheyDo?: string;
  audience?: string;
  cta?: string;
  entityTypeHint?: string;
  whoTheyAreHint?: string;
  offerHint?: string;
  voiceHint?: string;
  proofHints: string[];
  frictionHints: string[];
  opsHint?: string;
  opportunities: string[];
  websiteTitle?: string;
  websiteDescription?: string;
  h1: string[];
  navLabels: string[];
  ctas: string[];
  websiteTextPreview?: string;
  contactEmail?: string;
  contactPhone?: string;
  goal?: string;
  deliverable?: string;
  notes?: string;
  primaryUrl?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function strList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 1)
    .slice(0, limit);
}

function splitList(raw: string | undefined, limit = 6): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\s*\|\s*|\n|;/)
    .map((part) => part.replace(/^[-*•]\s*/, '').trim())
    .filter((part) => part.length > 3)
    .slice(0, limit);
}

export function collectEntitySignalBundle(project: FactoryProject): EntitySignalBundle {
  const artifacts = project.context?.artifacts || [];
  const branding = [...artifacts]
    .reverse()
    .find((a) => a.kind === 'branding' && (a.data?.hasVision || a.data?.visionSummary));
  const website = [...artifacts].reverse().find((a) => a.kind === 'website');
  const org = [...artifacts].reverse().find((a) => a.kind === 'organization');
  const brandingData = branding?.data || {};
  const websiteData = asRecord(website?.data) || {};
  const extracted = asRecord(websiteData.extracted) || {};
  const orgData = org?.data || {};

  const hasPhoto = Boolean(
    brandingData.hasVision || (project.attachments || []).some((a) => a.type === 'image'),
  );
  const primaryUrl =
    (project.url && !/\/api\/ctp\/assets\//i.test(project.url) ? project.url : undefined) ||
    str(websiteData.url) ||
    str(brandingData.detectedUrl);
  const hasWebsite = Boolean(primaryUrl && (extracted.title || extracted.textPreview));
  const hasNotes = Boolean(project.notes?.trim() || project.goal?.trim());

  const sourceBits = [
    hasPhoto ? 'launch photo' : null,
    primaryUrl ? primaryUrl : null,
    hasNotes && !hasPhoto && !primaryUrl ? 'launch notes' : null,
    hasNotes && (hasPhoto || primaryUrl) ? 'notes' : null,
  ].filter(Boolean);
  const sourceNote =
    sourceBits.length > 0
      ? `We started from ${sourceBits.join(' + ')}.`
      : 'We started from your launch signal.';

  const name =
    str(brandingData.suggestedClientName) ||
    str(brandingData.brandName) ||
    str(extracted.ogSiteName) ||
    str(extracted.title)?.split(/[|\-–—·]/)[0]?.trim() ||
    str(orgData.organizationName) ||
    project.client;

  return {
    name,
    sourceNote,
    hasPhoto,
    hasWebsite,
    hasNotes,
    visionSummary: str(brandingData.visionSummary),
    visionText: str(brandingData.visionText) || str(brandingData.textPreview),
    whatTheyDo: str(brandingData.whatTheyDo),
    audience: str(brandingData.audience),
    cta: str(brandingData.cta),
    entityTypeHint: str(brandingData.entityType),
    whoTheyAreHint: str(brandingData.whoTheyAre),
    offerHint: str(brandingData.offer) || str(brandingData.whatTheyDo),
    voiceHint: str(brandingData.voice),
    proofHints: [
      ...strList(brandingData.proofSignals),
      ...splitList(str(brandingData.proof)),
    ].slice(0, 6),
    frictionHints: [
      ...strList(brandingData.frictionSignals),
      ...splitList(str(brandingData.friction)),
      ...strList(brandingData.opportunities),
    ].slice(0, 8),
    opsHint: str(brandingData.opsClue) || str(brandingData.opsReality),
    opportunities: strList(brandingData.opportunities, 5),
    websiteTitle: str(extracted.title),
    websiteDescription: str(extracted.description),
    h1: strList(extracted.h1, 8),
    navLabels: strList(extracted.navLabels, 12),
    ctas: strList(extracted.ctas, 8),
    websiteTextPreview: str(extracted.textPreview),
    contactEmail: str(extracted.email),
    contactPhone: str(extracted.phone),
    goal: project.goal || str(orgData.goal),
    deliverable: project.deliverable || str(orgData.deliverable),
    notes: project.notes,
    primaryUrl,
  };
}

export function buildEntityProfileFallback(bundle: EntitySignalBundle): FactoryEntityProfile {
  return buildFallback(bundle) as FactoryEntityProfile;
}

export function parseEntityProfileLabeledText(
  text: string,
  fallback: FactoryEntityProfile,
): FactoryEntityProfile {
  return parseLabeled(text, fallback) as FactoryEntityProfile;
}

function buildSynthesisPrompt(bundle: EntitySignalBundle, fallback: FactoryEntityProfile): string {
  const signalBlock = [
    `Name hint: ${bundle.name}`,
    bundle.primaryUrl ? `URL: ${bundle.primaryUrl}` : null,
    bundle.entityTypeHint ? `Entity type hint: ${bundle.entityTypeHint}` : null,
    bundle.whatTheyDo ? `What they do: ${bundle.whatTheyDo}` : null,
    bundle.audience ? `Audience: ${bundle.audience}` : null,
    bundle.offerHint ? `Offer: ${bundle.offerHint}` : null,
    bundle.voiceHint ? `Voice: ${bundle.voiceHint}` : null,
    bundle.cta ? `CTA: ${bundle.cta}` : null,
    bundle.opsHint ? `Ops clue: ${bundle.opsHint}` : null,
    bundle.proofHints.length ? `Proof hints: ${bundle.proofHints.join(' | ')}` : null,
    bundle.frictionHints.length ? `Friction hints: ${bundle.frictionHints.join(' | ')}` : null,
    bundle.visionSummary ? `Vision summary: ${bundle.visionSummary}` : null,
    bundle.visionText ? `Vision text (trim): ${bundle.visionText.slice(0, 1800)}` : null,
    bundle.websiteTitle ? `Site title: ${bundle.websiteTitle}` : null,
    bundle.websiteDescription ? `Site description: ${bundle.websiteDescription}` : null,
    bundle.h1.length ? `H1s: ${bundle.h1.join(' | ')}` : null,
    bundle.navLabels.length ? `Nav: ${bundle.navLabels.join(' | ')}` : null,
    bundle.ctas.length ? `CTAs: ${bundle.ctas.join(' | ')}` : null,
    bundle.websiteTextPreview
      ? `Site text preview: ${bundle.websiteTextPreview.slice(0, 2200)}`
      : null,
    bundle.contactEmail ? `Email: ${bundle.contactEmail}` : null,
    bundle.goal ? `Goal: ${bundle.goal}` : null,
    bundle.notes ? `Notes: ${bundle.notes.slice(0, 600)}` : null,
    `Fallback who-they-are: ${fallback.whoTheyAre}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `You are an Efficiency Architects consultant preparing a sit-down Concept Pack.
From the signals below, write a short entity profile so a founder feels understood (person, business, or organization).
Do not invent facts that are not supported by the signals. If thin, say so in CONFIDENCE and keep WHO_THEY_ARE honest.

Return plain text with these labels exactly:
ENTITY_TYPE: person | business | organization | unknown
NAME: (best name)
TAGLINE: (one short line)
WHO_THEY_ARE: (2-4 sentences — identity, context, stage)
WHO_THEY_SERVE: (who / audience)
WHAT_THEY_OFFER: (offer / programs / service)
HOW_THEY_SOUND: (voice / tone in one short line)
PROOF: (up to 4 proof signals separated by " | ", or none)
FRICTION: (up to 5 capacity/friction gaps separated by " | ")
OPS_REALITY: (one short sentence on how work likely runs today)
PRIMARY_ASK: (main CTA / next step, or none)
EVIDENCE: (up to 6 short cited bullets separated by " | " — start with From photo / From homepage / From notes)
CONFIDENCE: high | medium | thin

Signals:
${signalBlock}`;
}

/**
 * Build entity profile — LLM synthesis when available, else deterministic fallback.
 */
export async function synthesizeFactoryEntityProfile(
  project: FactoryProject,
): Promise<FactoryEntityProfile> {
  const bundle = collectEntitySignalBundle(project);
  const fallback = buildEntityProfileFallback(bundle);

  try {
    const raw = await callClaudeText(buildSynthesisPrompt(bundle, fallback), { maxTokens: 1100 });
    if (!raw?.trim()) return fallback;
    const parsed = parseEntityProfileLabeledText(raw, fallback);
    console.info('[factory-entity-profile] synthesized', {
      projectId: project.id,
      name: parsed.name,
      entityType: parsed.entityType,
      confidence: parsed.confidence,
    });
    return parsed;
  } catch (err) {
    console.error('[factory-entity-profile] synthesis failed', project.id, err);
    return fallback;
  }
}

/** Sync profile for routes that cannot await LLM (uses fallback stitch only). */
export function buildFactoryEntityProfileSync(project: FactoryProject): FactoryEntityProfile {
  return buildEntityProfileFallback(collectEntitySignalBundle(project));
}
