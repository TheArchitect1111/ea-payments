/**
 * Concept Pack product visuals — story-first PNG renders (CID in email).
 */
import {
  renderAllConceptPngs,
  type ConceptRenderBrand,
} from '@/lib/factory-concept-renders';
import {
  evaluateConceptRenderInputs,
  tightenConceptRenderBrand,
} from '@/lib/factory-concept-quality-gate';

export type ConceptSampleKind = 'landing' | 'portal' | 'member';

export const CONCEPT_CUSTOM_CONTENT_IDS: Record<ConceptSampleKind, string> = {
  landing: 'concept-custom-landing',
  portal: 'concept-custom-portal',
  member: 'concept-custom-member',
};

export type ConceptMockupGenerateResult = {
  images: Array<{
    kind: ConceptSampleKind;
    filename: string;
    contentBase64: string;
    contentId: string;
    mimeType: string;
  }>;
  qualityOk: boolean;
  regenerated: boolean;
  reasons: string[];
  thinConfidenceNote?: string;
};

function toInline(brand: ConceptRenderBrand, pngs: { landing: Buffer; portal: Buffer; member: Buffer }) {
  return [
    {
      kind: 'landing' as const,
      filename: `concept-landing-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.landing.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.landing,
      mimeType: 'image/png',
    },
    {
      kind: 'portal' as const,
      filename: `concept-portal-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.portal.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.portal,
      mimeType: 'image/png',
    },
    {
      kind: 'member' as const,
      filename: `concept-member-${brand.clientName.slice(0, 24)}.png`,
      contentBase64: pngs.member.toString('base64'),
      contentId: CONCEPT_CUSTOM_CONTENT_IDS.member,
      mimeType: 'image/png',
    },
  ];
}

/**
 * Generate concept PNGs with quality gate + one regenerate pass.
 */
export async function generateCustomConceptInlineImages(
  brand: ConceptRenderBrand,
): Promise<ConceptMockupGenerateResult> {
  let active = { ...brand };
  let gate = evaluateConceptRenderInputs(active);
  let regenerated = false;

  if (!gate.ok) {
    active = tightenConceptRenderBrand(active);
    gate = evaluateConceptRenderInputs(active);
    regenerated = true;
  }

  let pngs = await renderAllConceptPngs(active);
  let finalGate = gate;

  if (!finalGate.ok) {
    active = tightenConceptRenderBrand(active);
    finalGate = evaluateConceptRenderInputs(active);
    pngs = await renderAllConceptPngs(active);
    regenerated = true;
  }

  const thinConfidenceNote = !finalGate.ok
    ? `Visual confidence: thin — concepts regenerated once; remaining gaps: ${finalGate.reasons.slice(0, 3).join('; ')}.`
    : undefined;

  return {
    images: toInline(active, pngs),
    qualityOk: finalGate.ok,
    regenerated,
    reasons: finalGate.reasons,
    thinConfidenceNote,
  };
}

/** @deprecated Coalition static samples */
export async function loadConceptSampleInlineImages(): Promise<
  ConceptMockupGenerateResult['images']
> {
  return [];
}
