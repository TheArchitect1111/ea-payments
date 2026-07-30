/**
 * Build media_brand_pack — first-party discovery + Openverse supplement.
 * Never invent likeness; never auto-publish unapproved media.
 */
import { listArtifacts } from '@/lib/factory-artifact';
import { createArtifactMeta, scoreCompleteness } from '@/lib/experience-creation/meta';
import {
  analyzeFacesWithMediaPipe,
  focalPointFromAnalysis,
} from '@/lib/experience-creation/face-focal';
import {
  OpenverseMediaProvider,
  canPublishMediaAsset,
  type DiscoveredMediaItem,
} from '@/lib/experience-creation/openverse-provider';
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

function guessKind(url: string, title?: string): MediaAsset['kind'] {
  const u = `${url} ${title || ''}`.toLowerCase();
  if (/logo/.test(u)) return 'logo';
  if (/portrait|headshot|profile|face/.test(u)) return 'portrait';
  if (/group|team|crowd/.test(u)) return 'group';
  if (/event|game|court|ceremony/.test(u)) return 'event';
  if (/product|shop|botanical|plant/.test(u)) return 'product';
  if (/city|building|landscape|location/.test(u)) return 'location';
  return 'other';
}

/**
 * High-quality temporary preview environments only — never a fabricated likeness.
 * Always preview_only / publication blocked.
 */
function temporaryPreviewEnvironmentAssets(themeBlob: string): MediaAsset[] {
  const care = /liaison|3hc|home\s*health|hospital|patient|clinic|care|nurse/i.test(themeBlob);
  const picks = care
    ? [
        {
          url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — calm clinical corridor light',
        },
        {
          url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — care team workspace atmosphere',
        },
        {
          url: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — home-care quiet interior',
        },
      ]
    : [
        {
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — editorial workspace light',
        },
        {
          url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — collaborative table atmosphere',
        },
        {
          url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1600&q=80',
          title: 'Temporary preview — focused craft desk',
        },
      ];

  return picks.map((pick, index) => ({
    id: `tmp-preview-${index + 1}`,
    kind: 'location' as const,
    url: pick.url,
    originalUrl: pick.url,
    title: pick.title,
    sourcePageUrl: 'https://unsplash.com',
    license: 'Unsplash License — temporary preview only',
    licenseClass: 'cc0' as const,
    licenseVerified: true,
    attribution: 'Unsplash (temporary preview media)',
    usageStatus: 'preview_only' as const,
    rightsStatus: 'verified' as const,
    previewEligible: true,
    publicationEligible: false,
    mediaProvider: 'temporary-preview',
    assignedSections: [['hero', 'path', 'proof'][index] || 'current'],
  }));
}

export function evaluateMediaGate(pack: MediaBrandPack): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const previewable = pack.assets.filter(
    (a) => a.previewEligible && a.usageStatus !== 'rejected',
  );
  if (!previewable.length && !pack.intentionalTypographyLed) {
    reasons.push(
      'Empty media plan — need preview-eligible assets or an approved typography-led direction.',
    );
  }
  if (pack.assets.some((a) => a.publicationEligible && a.rightsStatus === 'unknown')) {
    reasons.push('Publication eligibility cannot be granted for unknown-rights assets.');
  }
  for (const asset of pack.assets) {
    if (asset.publicationEligible) {
      const gate = canPublishMediaAsset({
        usageStatus: asset.usageStatus || 'discovered',
        licenseClass: asset.licenseClass || 'unclear',
        licenseVerified: Boolean(asset.licenseVerified),
        publicationEligible: asset.publicationEligible,
      });
      if (!gate.ok) {
        reasons.push(`${asset.id}: ${gate.reason}`);
      }
    }
  }
  return { ok: reasons.length === 0, reasons };
}

function discoveredToAsset(item: DiscoveredMediaItem, index: number): MediaAsset {
  const previewEligible =
    item.usageStatus === 'preview_only' ||
    item.usageStatus === 'publication_candidate' ||
    item.usageStatus === 'approved' ||
    item.usageStatus === 'discovered';
  return {
    id: assetId(index),
    url: item.thumbnailUrl || item.originalUrl,
    kind: guessKind(item.originalUrl, item.title),
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    aspectRatio:
      item.width && item.height ? `${item.width}:${item.height}` : undefined,
    qualityScore: Math.round(item.relevanceScore * 100) / 100,
    sourceUrl: item.originalUrl,
    rightsStatus:
      item.usageStatus === 'rejected'
        ? 'blocked'
        : item.usageStatus === 'approved'
          ? 'approved'
          : 'preview_only',
    previewEligible: previewEligible && item.usageStatus !== 'rejected',
    publicationEligible: false,
    usageStatus: item.usageStatus,
    title: item.title,
    creator: item.creator,
    license: item.license,
    licenseUrl: item.licenseUrl,
    licenseClass: item.licenseClass,
    attribution: item.attribution,
    mediaProvider: item.provider,
    foreignIdentifier: item.foreignIdentifier,
    licenseVerified: item.licenseVerified,
    licenseVerificationNotes: item.licenseVerificationNotes,
    rejectionReason: item.rejectionReason,
  };
}

export async function buildMediaBrandPack(
  project: FactoryProject,
  knowledge: SubjectKnowledgePack,
  options?: { skipOpenverse?: boolean; skipFaceFocal?: boolean },
): Promise<MediaBrandPack> {
  const context = project.context ? projectContextFromProject(project) : null;

  if (context) {
    const crawlMedia = listArtifacts(context, 'media_brand_pack').find((a) => {
      const data = asRecord(a.data);
      const provider = asRecord(data?.provider);
      return str(provider?.id) === 'uxg-research-crawl';
    });
    if (crawlMedia?.data) {
      return crawlMedia.data as unknown as MediaBrandPack;
    }
    const crawlOnly = listArtifacts(context, 'research_crawl_result').at(-1);
    if (crawlOnly?.data && asRecord(crawlOnly.data)?.schemaVersion === 1) {
      try {
        const { mapCrawlToMediaBrandPack } = await import('@/lib/uxg/research/map-to-packs');
        const { parseResearchCrawlResult } = await import('@/lib/uxg/research/schemas');
        return mapCrawlToMediaBrandPack(
          project,
          parseResearchCrawlResult(crawlOnly.data),
          knowledge,
        );
      } catch {
        // Fall through to legacy path.
      }
    }
  }

  const assets: MediaAsset[] = [];
  const colors: string[] = [];
  const warnings: string[] = [];
  const inputArtifactIds = [...knowledge.inputArtifactIds];
  const seen = new Set<string>();

  const addUrl = (
    url: string | undefined,
    sourceUrl: string,
    extra?: Partial<MediaAsset>,
  ) => {
    if (!url || !/^https?:\/\//i.test(url)) return;
    const key = url.split('?')[0]!.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    assets.push({
      id: assetId(assets.length),
      url,
      kind: guessKind(url, extra?.title),
      qualityScore: 0.55,
      sourceUrl,
      rightsStatus: 'preview_only',
      previewEligible: true,
      publicationEligible: false,
      usageStatus: 'discovered',
      mediaProvider: 'first-party',
      ...extra,
    });
  };

  if (context) {
    const website = listArtifacts(context, 'website').at(-1);
    const websiteData = asRecord(website?.data) || {};
    const extracted = asRecord(websiteData.extracted) || {};
    const pageUrl = str(websiteData.url) || knowledge.officialWebsite || '';
    addUrl(str(extracted.ogImage), pageUrl || 'website', {
      usageStatus: 'preview_only',
      mediaProvider: 'official-site',
    });
    const images = Array.isArray(extracted.images) ? extracted.images : [];
    for (const img of images.slice(0, 12)) {
      addUrl(str(img) || str(asRecord(img)?.url), pageUrl || 'website', {
        usageStatus: 'preview_only',
        mediaProvider: 'official-site',
      });
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
      addUrl(str(rec?.url) || str(item), str(rec?.sourceUrl) || knowledge.officialWebsite || 'prospect', {
        usageStatus: 'preview_only',
        mediaProvider: 'prospect-inventory',
      });
    }
  }

  // Openverse supplement — thematic queries, never invent likeness of the subject.
  if (!options?.skipOpenverse) {
    try {
      const theme =
        knowledge.currentWork[0] ||
        knowledge.professionalRoles.slice(0, 2).join(' ') ||
        knowledge.accomplishments[0] ||
        'documentary portrait environment';
      const openverseHits = await OpenverseMediaProvider.search({
        // Prefer org/location/theme over bare personal name (Openverse rarely indexes private individuals).
        subject: knowledge.organizations[0] || knowledge.locations[0] || theme,
        organization: knowledge.organizations[0],
        location: knowledge.locations[0],
        theme,
        storyConcept: knowledge.biography.slice(0, 120),
        pageSize: 10,
      });
      for (const hit of openverseHits) {
        const key = hit.originalUrl.split('?')[0]!.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        assets.push(discoveredToAsset(hit, assets.length));
      }
      if (!openverseHits.length) {
        warnings.push('Openverse returned no results for this subject query.');
      } else if (openverseHits.every((h) => h.usageStatus === 'rejected')) {
        warnings.push('Openverse hits were rejected as irrelevant or unsupported.');
      }
    } catch (err) {
      warnings.push(
        `Openverse discovery failed: ${err instanceof Error ? err.message : 'error'} — continuing with first-party media only (no stock substitution).`,
      );
    }
  }

  // Face / focal analysis (async worker path; never in page render).
  if (!options?.skipFaceFocal) {
    for (const asset of assets) {
      if (asset.usageStatus === 'rejected') continue;
      const analysis = await analyzeFacesWithMediaPipe({ imageUrl: asset.url });
      asset.focal = {
        status: analysis.status,
        provider: analysis.provider,
        faceCount: analysis.faceCount,
        photographType: analysis.photographType,
        objectPosition: analysis.cropHints[0]?.objectPosition,
        cropHints: analysis.cropHints.map((h) => ({
          viewport: h.viewport,
          objectPosition: h.objectPosition,
          focalPoint: h.focalPoint,
        })),
        error: analysis.error,
        analyzedAt: analysis.analyzedAt,
      };
      asset.facePresent = analysis.faceCount > 0;
      asset.focalPoint = focalPointFromAnalysis(analysis);
      if (analysis.photographType === 'portrait') asset.kind = 'portrait';
      if (analysis.photographType === 'group') asset.kind = 'group';
    }
  }

  // Assign preview-eligible assets to story sections intentionally.
  const sectionSlots = ['hero', 'path', 'proof', 'organizations', 'current'];
  let slot = 0;
  for (const asset of assets) {
    if (!asset.previewEligible || asset.usageStatus === 'rejected') continue;
    asset.assignedSections = [sectionSlots[slot % sectionSlots.length]!];
    slot += 1;
  }

  // Ensure at least three temporary preview environments when discovered media is thin.
  if (assets.filter((a) => a.previewEligible).length < 3) {
    warnings.push(
      'Supplementing with temporary preview environment imagery (blocked from publication).',
    );
    const themeBlob = `${knowledge.organizations.join(' ')} ${knowledge.professionalRoles.join(' ')} ${knowledge.currentWork.join(' ')} ${knowledge.biography}`.toLowerCase();
    const temporary = temporaryPreviewEnvironmentAssets(themeBlob);
    for (const item of temporary) {
      const key = item.url.split('?')[0]!.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      assets.push(item);
    }
  }

  const intentionalTypographyLed = assets.filter((a) => a.previewEligible).length === 0;
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
    assets.some((a) => a.previewEligible),
    assets.some((a) => a.kind === 'portrait' || a.kind === 'logo'),
    colors.length > 0,
    assets.some((a) => a.attribution || a.mediaProvider === 'official-site'),
    !intentionalTypographyLed,
  ]);

  const pack: MediaBrandPack = {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: knowledge.verifiedIdentity.name,
      providerId: 'experience-creation-media',
      inputArtifactIds,
      provenanceNotes:
        'First-party + Openverse candidates — preview-only until EA media-usage gate approval',
      confidence: assets.length ? 0.55 : 0.2,
      completeness,
      warnings,
    }),
    kind: 'media_brand_pack',
    assets,
    colors: colors.length ? colors : ['#14110F', '#C4A574'],
    typographyClues: intentionalTypographyLed
      ? ['Editorial display typography carries the first viewport']
      : ['Pair documentary imagery with restrained editorial type; honor object-position focals'],
    brandPatterns: [],
    missingMediaRequests,
    intentionalTypographyLed,
  };

  const gate = evaluateMediaGate(pack);
  pack.validation = { ok: gate.ok, reasons: gate.reasons };
  return pack;
}

/** Sync wrapper for fixture tests that skip network. */
export function buildMediaBrandPackSync(
  project: FactoryProject,
  knowledge: SubjectKnowledgePack,
): MediaBrandPack {
  // Intentionally sync path without Openverse/face — used only by labeled fixtures.
  const context = project.context ? projectContextFromProject(project) : null;
  void context;
  return {
    ...createArtifactMeta({
      projectId: project.id,
      subjectIdentity: knowledge.verifiedIdentity.name,
      providerId: 'experience-creation-media-fixture',
      inputArtifactIds: [...knowledge.inputArtifactIds],
      provenanceNotes: 'FIXTURE_ONLY media pack — no Openverse',
      confidence: 0.2,
      completeness: 0.2,
      warnings: ['Fixture media pack'],
    }),
    kind: 'media_brand_pack',
    assets: [],
    colors: ['#14110F', '#C4A574'],
    typographyClues: ['Editorial display typography carries the first viewport'],
    brandPatterns: [],
    missingMediaRequests: ['Subject-owned portrait suitable for hero use'],
    intentionalTypographyLed: true,
    validation: { ok: true, reasons: [] },
  };
}
