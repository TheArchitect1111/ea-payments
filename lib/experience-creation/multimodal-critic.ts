/**
 * Multimodal visual critic — Playwright screenshots + ECE packs → structured scores.
 * Heuristic-only critic may NOT certify production output.
 * Uses provider-neutral vision adapter (OpenAI gateway preferred; Anthropic optional fallback).
 */
import { findForbiddenPublicCopy } from '@/lib/factory-forbidden-copy.mjs';
import { evaluateExperienceCritic, type CriticResult } from '@/lib/experience-creation/critic';
import {
  critiqueScreenshotWithConfiguredProvider,
  resolveVisionCriticProvider,
} from '@/lib/experience-creation/vision-critic-provider';
import type {
  ContentCreativePack,
  ExperienceManifest,
  MediaBrandPack,
  SubjectKnowledgePack,
} from '@/lib/experience-creation/types';

export const ECE_VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
] as const;

export type ViewportScreenshot = {
  viewport: (typeof ECE_VIEWPORTS)[number]['name'];
  width: number;
  height: number;
  surface: 'website' | 'portal';
  conceptId: string;
  /** PNG base64 without data-URL prefix when possible */
  base64: string;
  overflowX?: boolean;
  consoleErrors?: string[];
  failedRequests?: string[];
  brokenLinks?: string[];
  missingImages?: string[];
};

export type MultimodalCriticResult = CriticResult & {
  mode: 'multimodal' | 'heuristic_only' | 'blocked_provider';
  visionProvider?: string;
  viewportResults: Array<{
    viewport: string;
    surface: string;
    conceptId: string;
    visionSummary?: string;
    scores?: Record<string, number>;
    rejectReasons?: string[];
  }>;
  repairInstructions: string[];
};

const CRITIC_PROMPT = `You are the EA multimodal visual critic for premium website and portal experiences.
Score 0-100 for: premiumQuality, subjectSpecificity, storytelling, originality, composition, typography, imageSelection, faceFocalCropping, responsiveBehavior, accessibility, websitePortalContinuity, conceptSimilarityRisk, placeholderLeakageRisk, linkIntegrity.
Reject (list reasons) if you see: generic filler, repeated clarification text, fake metrics, internal instructions, empty media treatments, broken links, near-duplicate composition, poorly cropped faces/subjects, corporate boxy design, weak website-to-portal continuity, mobile failures.
Return ONLY JSON:
{"scores":{...},"reject":true|false,"reasons":[],"repairInstructions":[]}`;

function parseVisionJson(text: string): {
  scores: Record<string, number>;
  reject: boolean;
  reasons: string[];
  repairInstructions: string[];
} {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('no json');
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      scores?: Record<string, number>;
      reject?: boolean;
      reasons?: string[];
      repairInstructions?: string[];
    };
    return {
      scores: parsed.scores || {},
      reject: Boolean(parsed.reject),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      repairInstructions: Array.isArray(parsed.repairInstructions)
        ? parsed.repairInstructions
        : [],
    };
  } catch {
    return {
      scores: {},
      reject: true,
      reasons: ['Vision critic returned unparseable output.'],
      repairInstructions: ['Re-run vision critic with a clearer screenshot.'],
    };
  }
}

export async function evaluateMultimodalExperienceCritic(input: {
  knowledge: SubjectKnowledgePack;
  media: MediaBrandPack;
  content: ContentCreativePack;
  manifests: ExperienceManifest[];
  screenshots?: ViewportScreenshot[];
  requireMultimodal?: boolean;
}): Promise<MultimodalCriticResult> {
  const heuristic = evaluateExperienceCritic(input);
  const requireMm = Boolean(input.requireMultimodal);
  const shots = input.screenshots || [];

  if (requireMm && !shots.length) {
    return {
      ...heuristic,
      ok: false,
      mode: 'blocked_provider',
      reasons: [
        ...heuristic.reasons,
        'BLOCKED_PROVIDER: multimodal critic requires Playwright screenshots — none provided.',
      ],
      viewportResults: [],
      repairInstructions: [
        'Capture viewports 390×844, 768×1024, 1440×900, 1920×1080 for website and portal.',
      ],
    };
  }

  if (!shots.length) {
    return {
      ...heuristic,
      ok: false,
      mode: 'heuristic_only',
      reasons: [
        ...heuristic.reasons,
        'Heuristic-only critic cannot certify production output — screenshots required.',
      ],
      viewportResults: [],
      repairInstructions: ['Provide Playwright screenshots for multimodal criticism.'],
    };
  }

  const provider = resolveVisionCriticProvider();
  if (!provider.ready) {
    return {
      ...heuristic,
      ok: false,
      mode: 'blocked_provider',
      visionProvider: provider.id,
      reasons: [
        ...heuristic.reasons,
        `BLOCKED_PROVIDER: no vision-capable model configured (${provider.missing || 'missing credentials'}).`,
      ],
      viewportResults: [],
      repairInstructions: [
        'Configure OPENAI_API_KEY for EA AI gateway vision (preferred), or ANTHROPIC_API_KEY as fallback.',
      ],
    };
  }

  const viewportResults: MultimodalCriticResult['viewportResults'] = [];
  const repairInstructions: string[] = [...heuristic.repairHistory];
  const reasons = [...heuristic.reasons];
  const scores = { ...heuristic.scores };

  const sample = shots.slice(0, Math.min(shots.length, 72));
  for (const shot of sample) {
    const artifactContext = {
      subject: input.knowledge.verifiedIdentity.name,
      knowledgeSummary: {
        claims: input.knowledge.claims.length,
        citations: input.knowledge.citations.length,
        biographyChars: input.knowledge.biography.length,
      },
      mediaSummary: {
        assets: input.media.assets.length,
        typographyLed: input.media.intentionalTypographyLed,
        usage: input.media.assets.map((a) => a.usageStatus || a.rightsStatus).slice(0, 8),
      },
      contentSummary: {
        premises: input.content.premises.map((p) => p.name),
        biographyChars: input.content.biography.length,
      },
      manifestPremise:
        input.manifests.find(
          (m) =>
            m.premiseId.includes(shot.conceptId) ||
            shot.conceptId.includes(m.premiseId.replace('premise-', '')),
        )?.premiseName || null,
      compositions: input.manifests.map((m) =>
        m.pageStructure.map((s) => s.composition).join('→'),
      ),
      viewport: `${shot.width}x${shot.height}`,
      conceptId: shot.conceptId,
      surface: shot.surface,
    };

    const { text: vision } = await critiqueScreenshotWithConfiguredProvider(
      shot.base64,
      'image/png',
      `${CRITIC_PROMPT}\nContext JSON: ${JSON.stringify(artifactContext)}`,
    );

    if (!vision) {
      viewportResults.push({
        viewport: shot.viewport,
        surface: shot.surface,
        conceptId: shot.conceptId,
        rejectReasons: ['Vision provider returned empty result.'],
      });
      reasons.push(`Vision critic failed for ${shot.surface}/${shot.viewport}.`);
      continue;
    }

    const parsed = parseVisionJson(vision);
    viewportResults.push({
      viewport: shot.viewport,
      surface: shot.surface,
      conceptId: shot.conceptId,
      visionSummary: vision.slice(0, 400),
      scores: parsed.scores,
      rejectReasons: parsed.reasons,
    });
    for (const [k, v] of Object.entries(parsed.scores)) {
      if (typeof v === 'number') {
        scores[`mm_${k}`] = Math.round(
          scores[`mm_${k}`] != null ? (scores[`mm_${k}`]! + v) / 2 : v,
        );
      }
    }
    if (parsed.reject) {
      reasons.push(...parsed.reasons.map((r) => `Vision[${shot.viewport}]: ${r}`));
    }
    repairInstructions.push(...parsed.repairInstructions);

    if (shot.overflowX) reasons.push(`Horizontal overflow at ${shot.viewport}.`);
    if (shot.brokenLinks?.length) reasons.push(`Broken links at ${shot.viewport}.`);
    if (shot.missingImages?.length) reasons.push(`Missing images at ${shot.viewport}.`);
    if (shot.consoleErrors?.length) reasons.push(`Console errors at ${shot.viewport}.`);
  }

  const leak = findForbiddenPublicCopy({
    content: input.content,
    manifests: input.manifests,
  });
  if (!leak.ok) {
    reasons.push(`Forbidden/internal text: ${leak.matches[0]}`);
  }

  const mmPremium = scores.mm_premiumQuality ?? 0;
  const mmSubject = scores.mm_subjectSpecificity ?? 0;
  if (mmPremium && mmPremium < 80) reasons.push(`Premium quality ${mmPremium}/100.`);
  if (mmSubject && mmSubject < 80) reasons.push(`Subject specificity ${mmSubject}/100.`);

  const uniqueReasons = [...new Set(reasons)];
  const ok = uniqueReasons.length === 0 && heuristic.ok !== false && mmPremium >= 80;

  return {
    ok,
    scores,
    reasons: uniqueReasons,
    repairHistory: repairInstructions,
    mode: 'multimodal',
    visionProvider: provider.id,
    viewportResults,
    repairInstructions,
  };
}
