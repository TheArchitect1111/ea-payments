/**
 * Build media_brand_pack — discover candidate media; never invent likeness rights.
 */
import { listArtifacts } from '@/lib/factory-artifact';
import { createArtifactMeta, scoreCompleteness } from '@/lib/experience-creation/meta';
import type { MediaAsset, MediaBrandPack, SubjectKnowledgePack } from '@/lib/experience-creation/types';
import type { FactoryProject } from '@/lib/factory-project-store';
import { projectContextFromProject } from '@/lib/factory-project-context';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function assetId(index: number) {
  return `media-${index + 1}`;
}

function guessKind(url: string): MediaAsset['kind'] {
  const u = url.toLowerCase();
  if (/logo/.test(u)) return 'logo';
  if (/portrait|headshot|profile|face/.test(u)) return 'portrait';
  if (/event|game|court/.test(u)) return 'event';
  if (/product|shop/.test(u)) return 'product';
  return 'other';
}

export function evaluateMediaGate(pack: MediaBrandPack): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const previewable = pack.assets.filter((a) => a.previewEligible);
  if (!previewable.length && !pack.intentionalTypographyLed) {
    reasons.push('Empty media plan — need preview-eligible assets or an approved typography-led direction.');
  }
  if (pack.assets.some((a) => a.publicationEligible && a.rightsStatus === 'unknown')) {
    reasons.push('Publication eligibility cannot be granted for unknown-rights assets.');
  }
  return { ok: reasons.length === 0, reasons };
}

export function buildMediaBrandPack(
  project: FactoryProject,
  knowledge: SubjectKnowledgePack,
): MediaBrandPack {
  const context = project.context ? projectContextFromProject(project) : null;
  const assets: MediaAsset[] = [];
  const colors: string[] = [];
  const warnings: string[] = [];
  const inputArtifactIds = [...knowledge.inputArtifactIds];
  const seen = new Set<string>();

  const addUrl = (url: string | undefined, sourceUrl: string) => {
    if (!url || !/^https?:\/\//i.test(url)) return;
    const key = url.split('?')[0]!.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    // Never auto-mark publication eligible.
    assets.push({
      id: assetId(assets.length),
      url,
      kind: guessKind(url),
      qualityScore: 0.55,
      sourceUrl,
      rightsStatus: 'preview_only',
      previewEligible: true,
      publicationEligible: false,
    });
  };

  if (context) {
    const website = listArtifacts(context, 'website').at(-1);
    const websiteData = asRecord(website?.data) || {};
    const extracted = asRecord(websiteData.extracted) || {};
    const pageUrl = str(websiteData.url) || knowledge.officialWebsite || '';
    addUrl(str(extracted.ogImage), pageUrl || 'website');
    const images = Array.isArray(extracted.images) ? extracted.images : [];
    for (const img of images.slice(0, 12)) {
      addUrl(str(img) || str(asRecord(img)?.url), pageUrl || 'website');
    }

    const branding = listArtifacts(context, 'branding').at(-1);
    const brandingData = asRecord(branding?.data) || {};
    for (const color of [str(brandingData.primaryColor), str(brandingData.accentColor)]) {
      if (color && /^#/.test(color) && !colors.includes(color)) colors.push(color);
    }

    const prospect = listArtifacts(context, 'prospect_profile').at(-1);
    const prospectData = asRecord(prospect?.data) || {};
    const inventory = Array.isArray(prospectData.assetInventory)
      ? prospectData.assetInventory
      : [];
    for (const item of inventory.slice(0, 20)) {
      const rec = asRecord(item);
      addUrl(str(rec?.url) || str(item), str(rec?.sourceUrl) || knowledge.officialWebsite || 'prospect');
    }
  }

  for (const media of knowledge.interviewsAndMedia.slice(0, 6)) {
    // Pages themselves are media references, not image assets.
    void media;
  }

  if (!assets.length) {
    warnings.push(
      'No preview-eligible images discovered. Concepts must be typography-led until subject-owned media is supplied.',
    );
  }

  const intentionalTypographyLed = assets.length === 0;
  const missingMediaRequests = intentionalTypographyLed
    ? [
        'Subject-owned portrait suitable for hero use',
        'Approved brand logo (SVG/PNG)',
        '2–4 environment or work-in-progress photographs',
      ]
    : assets.every((a) => a.kind !== 'portrait')
      ? ['Subject-owned portrait for hero treatment']
      : [];

  const completeness = scoreCompleteness([
    assets.length > 0,
    assets.some((a) => a.kind === 'portrait' || a.kind === 'logo'),
    colors.length > 0,
    !intentionalTypographyLed,
  ]);

  const pack: MediaBrandPack = {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: knowledge.verifiedIdentity.name,
      providerId: 'experience-creation-media',
      inputArtifactIds,
      provenanceNotes: 'Discovered public media candidates — preview-only until rights approved',
      confidence: assets.length ? 0.5 : 0.2,
      completeness,
      warnings,
    }),
    kind: 'media_brand_pack',
    assets,
    colors: colors.length ? colors : ['#14110F', '#C4A574'],
    typographyClues: intentionalTypographyLed
      ? ['Editorial display typography carries the first viewport']
      : ['Pair documentary imagery with restrained editorial type'],
    brandPatterns: [],
    missingMediaRequests,
    intentionalTypographyLed,
  };

  const gate = evaluateMediaGate(pack);
  pack.validation = { ok: gate.ok, reasons: gate.reasons };
  return pack;
}
