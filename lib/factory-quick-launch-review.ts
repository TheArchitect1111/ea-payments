/**
 * Presentation payload for one-page Universal Quick Launch review.
 * Reuses ProjectContext artifacts + concept previews — no second store.
 */
import { listArtifacts } from '@/lib/factory-artifact';
import {
  listConceptPreviewsFromContext,
  readCreativeDirection,
  readExperienceConceptsArtifact,
  resolveConceptPreviewDraft,
} from '@/lib/factory-concept-previews';
import {
  buildContentPackageFromProject,
  readContentPackageFromContext,
} from '@/lib/factory-content-package';
import { evaluateConceptQualityGate } from '@/lib/factory-concept-quality-gate';
import { buildFactoryEntityProfileSync } from '@/lib/factory-entity-profile';
import { projectContextFromProject } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';

export type QuickLaunchPackageSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  sourceUrl?: string;
};

export type QuickLaunchConceptCard = {
  conceptId: string;
  name: string;
  premise: string;
  description: string;
  recommended: boolean;
  selected: boolean;
  lens: string;
  compositionSignature: string;
  primaryColor: string;
  accentColor: string;
  websitePreviewPath: string;
  portalPreviewPath: string;
  websiteVerified: boolean;
  portalVerified: boolean;
};

export type QuickLaunchReviewPayload = {
  projectId: string;
  client: string;
  packageReady: boolean;
  conceptsReady: boolean;
  qualityBlocked: boolean;
  qualityReasons: string[];
  selectedConceptId: string | null;
  recommendedConceptId: string | null;
  selectionStatus: string | null;
  packageSections: QuickLaunchPackageSection[];
  concepts: QuickLaunchConceptCard[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pushSection(
  sections: QuickLaunchPackageSection[],
  section: QuickLaunchPackageSection,
) {
  if (!section.summary && section.bullets.length === 0) return;
  sections.push(section);
}

/**
 * Build research + concept review materials for the Quick Launch page.
 * When `verifyPreviews` is true, resolves each concept draft (durable recompose).
 */
export async function buildQuickLaunchReview(
  project: FactoryProject,
  options?: { verifyPreviews?: boolean },
): Promise<QuickLaunchReviewPayload> {
  const context = project.context ? projectContextFromProject(project) : null;
  const sections: QuickLaunchPackageSection[] = [];

  // Prefer ECE content package section when present
  if (context) {
    const eceContent = [...(project.context?.outputs || [])]
      .filter((o) => o.worker === 'content-creative-pack')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .at(-1);
    const ecePayload = asRecord(eceContent?.payload);
    if (ecePayload) {
      pushSection(sections, {
        id: 'story-creative-package',
        title: 'Story and creative package',
        summary: str(ecePayload.positioning) || str(ecePayload.coreStory) || 'Creative package',
        bullets: [
          str(ecePayload.coreStory) || '',
          str(ecePayload.biography) || '',
          str(ecePayload.portalPurpose) || '',
          ...(Array.isArray(ecePayload.premises)
            ? ecePayload.premises.map((p) => {
                const rec = asRecord(p);
                return rec
                  ? `${str(rec.name)}: ${str(rec.heroHeadline) || str(rec.narrativeLens) || ''}`
                  : '';
              })
            : []),
        ].filter(Boolean),
      });
    }
  }

  if (context) {
    const contentPackage =
      readContentPackageFromContext(context) || buildContentPackageFromProject(project);
    pushSection(sections, {
      id: 'content-package',
      title: 'Content and copy package',
      summary: contentPackage.positioning,
      bullets: [
        contentPackage.centralStory,
        ...contentPackage.claims.slice(0, 5).map((c) => c.text),
        contentPackage.mediaPlan.strategy,
        ...contentPackage.mediaPlan.items.map(
          (item) => `Media: ${item.label} (${item.status})`,
        ),
      ].filter(Boolean),
    });

    const profile = buildFactoryEntityProfileSync(project);
    pushSection(sections, {
      id: 'verified-profile',
      title: 'Verified profile',
      summary: profile.name || project.client,
      bullets: [
        profile.whoTheyAre ? profile.whoTheyAre : '',
        profile.whatTheyOffer ? `Offer: ${profile.whatTheyOffer}` : '',
        profile.whoTheyServe ? `Audience: ${profile.whoTheyServe}` : '',
        `Confidence: ${profile.confidence}`,
        ...profile.proofSignals.slice(0, 3),
      ].filter(Boolean),
    });

    const website = listArtifacts(context, 'website').at(-1);
    const websiteData = asRecord(website?.data) || {};
    const extracted = asRecord(websiteData.extracted) || {};
    pushSection(sections, {
      id: 'research-report',
      title: 'Research report',
      summary:
        str(extracted.title) ||
        str(websiteData.title) ||
        'Public website and identity research',
      bullets: [
        str(extracted.description) || str(extracted.textPreview) || '',
        str(websiteData.url) ? `Source: ${str(websiteData.url)}` : '',
      ].filter(Boolean),
      sourceUrl: str(websiteData.url),
    });

    const prospect = listArtifacts(context, 'prospect_profile').at(-1);
    const prospectData = asRecord(prospect?.data) || {};
    const citations = Array.isArray(prospectData.citations)
      ? prospectData.citations
      : Array.isArray(prospectData.sources)
        ? prospectData.sources
        : [];
    const citationBullets = citations
      .slice(0, 8)
      .map((item) => {
        const rec = asRecord(item);
        const url = str(rec?.url) || str(item);
        const title = str(rec?.title);
        return title && url ? `${title} — ${url}` : url || title || '';
      })
      .filter(Boolean);
    pushSection(sections, {
      id: 'sources-evidence',
      title: 'Sources and evidence',
      summary:
        citationBullets.length > 0
          ? `${citationBullets.length} public sources cited`
          : 'Sources gathered from website and research providers',
      bullets:
        citationBullets.length > 0
          ? citationBullets
          : [
              str(websiteData.url) || '',
              ...(listArtifacts(context, 'organization')
                .slice(-1)
                .map((a) => str(asRecord(a.data)?.name) || '')
                .filter(Boolean) as string[]),
            ].filter(Boolean),
    });

    const branding = listArtifacts(context, 'branding').at(-1);
    const brandingData = asRecord(branding?.data) || {};
    pushSection(sections, {
      id: 'media-brand',
      title: 'Media and brand inventory',
      summary:
        str(brandingData.visionSummary) ||
        str(brandingData.whatTheyDo) ||
        'Brand and media signals from research',
      bullets: [
        str(brandingData.visualStyle) || '',
        str(brandingData.photography) || '',
        brandingData.hasPhoto ? 'Photography / imagery signals found' : '',
        str(brandingData.detectedUrl) || '',
      ].filter(Boolean),
      sourceUrl: str(brandingData.detectedUrl),
    });

    const creative = readCreativeDirection(context);
    pushSection(sections, {
      id: 'story-strategy',
      title: 'Story strategy',
      summary:
        creative?.story?.sentence ||
        creative?.organizationName ||
        'Central story direction',
      bullets: [
        creative?.story?.audience ? `Audience: ${creative.story.audience}` : '',
        creative?.story?.transformation
          ? `Transformation: ${creative.story.transformation}`
          : '',
        ...(Array.isArray(creative?.homepageStoryBeats)
          ? creative!.homepageStoryBeats!.slice(0, 5).map((b) => `Beat: ${b}`)
          : []),
      ].filter(Boolean),
    });

    pushSection(sections, {
      id: 'creative-brief',
      title: 'Creative brief',
      summary:
        creative?.visualDirection?.style ||
        'Visual and experiential direction',
      bullets: [
        creative?.visualDirection?.photography
          ? `Photography: ${creative.visualDirection.photography}`
          : '',
        creative?.visualDirection?.typography
          ? `Typography: ${creative.visualDirection.typography}`
          : '',
        creative?.visualDirection?.composition
          ? `Composition: ${creative.visualDirection.composition}`
          : '',
        creative?.visualDirection?.motion
          ? `Motion: ${creative.visualDirection.motion}`
          : '',
        creative?.portalContinuity?.purpose
          ? `Portal continuity: ${creative.portalContinuity.purpose}`
          : '',
      ].filter(Boolean),
    });

    const exec = listArtifacts(context, 'executive_summary').at(-1);
    const execData = asRecord(exec?.data) || {};
    const conceptsArt = readExperienceConceptsArtifact(context);
    const conceptsData = asRecord(conceptsArt?.data) || {};
    const concepts = Array.isArray(conceptsData.concepts) ? conceptsData.concepts : [];
    pushSection(sections, {
      id: 'content-copy',
      title: 'Content and copy package',
      summary:
        str(execData.summary) ||
        str(execData.headline) ||
        `${concepts.length || 0} concept directions prepared`,
      bullets: concepts
        .slice(0, 3)
        .map((c) => {
          const rec = asRecord(c);
          const name = str(rec?.name) || 'Concept';
          const rationale = str(rec?.rationale) || str(rec?.story?.sentence) || '';
          return rationale ? `${name}: ${rationale}` : name;
        })
        .filter(Boolean),
    });
  }

  const previews = context ? listConceptPreviewsFromContext(context) : null;
  const conceptsArt = context ? readExperienceConceptsArtifact(context) : null;
  const conceptsData = asRecord(conceptsArt?.data) || {};
  const rawConcepts = Array.isArray(conceptsData.concepts) ? conceptsData.concepts : [];
  const selectedConceptId =
    str(previews?.selectedConceptId) || str(conceptsData.selectedConceptId) || null;
  const recommendedConceptId =
    str(previews?.recommendedConceptId) || str(conceptsData.recommendedConceptId) || null;
  const selectionStatus =
    str(previews?.selectionStatus) || str(conceptsData.selectionStatus) || null;

  const verify = Boolean(options?.verifyPreviews);
  const cards: QuickLaunchConceptCard[] = [];

  for (const raw of rawConcepts) {
    const rec = asRecord(raw) || {};
    const conceptId = str(rec.id);
    if (!conceptId) continue;
    const preview = previews?.previews?.find((p) => p.conceptId === conceptId);
    const websitePreviewPath =
      preview?.websitePreviewPath ||
      `/preview/factory/${encodeURIComponent(project.id)}/${encodeURIComponent(conceptId)}`;
    const portalPreviewPath =
      preview?.portalPreviewPath ||
      `/preview/factory/${encodeURIComponent(project.id)}/${encodeURIComponent(conceptId)}/portal`;

    let websiteVerified = Boolean(preview);
    let portalVerified = Boolean(preview);
    if (verify) {
      const resolved = await resolveConceptPreviewDraft(project.id, conceptId);
      websiteVerified = resolved.ok;
      portalVerified = resolved.ok;
      if (resolved.ok) {
        console.info('[quick-launch-review] preview verified', {
          projectId: project.id,
          conceptId,
          source: resolved.source,
        });
      } else {
        console.error('[quick-launch-review] preview verify failed', {
          projectId: project.id,
          conceptId,
          reason: resolved.reason,
        });
      }
    }

    const story = asRecord(rec.story) || {};
    const website = asRecord(rec.website) || {};
    cards.push({
      conceptId,
      name: str(rec.name) || conceptId,
      premise:
        str(rec.rationale) ||
        str(website.composition) ||
        str(story.sentence) ||
        'Custom creative direction',
      description:
        str(story.sentence) ||
        str(story.transformation) ||
        str(rec.rationale) ||
        'A directed website and portal sample for this subject.',
      recommended: conceptId === recommendedConceptId || Boolean(preview?.recommended),
      selected: conceptId === selectedConceptId,
      lens: String(preview?.lens || 'story'),
      compositionSignature: String(preview?.compositionSignature || website.composition || ''),
      primaryColor: String(preview?.primaryColor || '#17130F'),
      accentColor: String(preview?.accentColor || '#B9894D'),
      websitePreviewPath,
      portalPreviewPath,
      websiteVerified,
      portalVerified,
    });
  }

  // Prefer preview pack ordering when present
  if (previews?.previews?.length) {
    cards.sort((a, b) => {
      const ai = previews.previews.findIndex((p) => p.conceptId === a.conceptId);
      const bi = previews.previews.findIndex((p) => p.conceptId === b.conceptId);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
  }

  const verifiedCards = cards.filter((c) => c.websiteVerified && c.portalVerified);
  const contentPackage = context
    ? readContentPackageFromContext(context) || buildContentPackageFromProject(project)
    : buildContentPackageFromProject(project);
  const quality = evaluateConceptQualityGate({
    contentPackage,
    previews,
  });
  const qualityBlocked = !quality.ok;
  const advertiseConcepts = !qualityBlocked
    ? verify
      ? verifiedCards
      : cards.filter((c) => Boolean(previews?.previews?.length) || c.websiteVerified)
    : [];

  return {
    projectId: project.id,
    client: project.client,
    packageReady: sections.length > 0,
    conceptsReady: advertiseConcepts.length > 0,
    qualityBlocked,
    qualityReasons: quality.ok ? [] : quality.reasons,
    selectedConceptId,
    recommendedConceptId,
    selectionStatus,
    packageSections: sections,
    concepts: advertiseConcepts,
  };
}
