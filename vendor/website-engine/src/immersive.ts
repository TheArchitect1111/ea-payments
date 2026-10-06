import type { WebsitePageManifest, WebsiteSectionDefinition, WebsiteSectionKind } from './types';

export const EA_IMMERSIVE_SECTION_IDS = [
  'immersive.hero',
  'immersive.editorialFeature',
  'immersive.productStage',
  'immersive.cinematicMedia',
  'immersive.benefitPair',
  'immersive.trustStory',
  'immersive.proofStatement',
  'immersive.conversionFinale',
] as const;

export const EA_IMMERSIVE_SECTIONS: WebsiteSectionDefinition[] = [
  { id:'immersive.hero', kind:'hero', name:'Immersive Hero', description:'Oversized editorial hero with dominant media, short copy, and one decisive action.', source:'shared', reusable:true, aiPurpose:'Open with one outcome, minimal supporting copy, and a visually dominant product or lifestyle scene.' },
  { id:'immersive.editorialFeature', kind:'content', name:'Editorial Feature', description:'Large statement paired with concise explanatory copy and spacious visual composition.', source:'shared', reusable:true, aiPurpose:'Explain one major benefit with publication-scale hierarchy and generous negative space.' },
  { id:'immersive.productStage', kind:'features', name:'Product Stage', description:'Product or interface UI presented as a physical focal object inside a spacious scene.', source:'shared', reusable:true, aiPurpose:'Make the product tangible with layered cards, device UI, or a focused visual artifact.' },
  { id:'immersive.cinematicMedia', kind:'media', name:'Cinematic Media', description:'Large-format media scene that carries the narrative between feature sections.', source:'shared', reusable:true, aiPurpose:'Use immersive media to change visual intensity and advance the story without dense copy.' },
  { id:'immersive.benefitPair', kind:'features', name:'Benefit Pair', description:'Two oversized benefits displayed as a balanced modular pair.', source:'shared', reusable:true, aiPurpose:'Present exactly two high-value benefits with equal visual weight.' },
  { id:'immersive.trustStory', kind:'features', name:'Trust Story', description:'Security, reliability, support, or proof points presented as a visual narrative.', source:'shared', reusable:true, aiPurpose:'Build confidence with a strong trust headline and a small set of concrete proof points.' },
  { id:'immersive.proofStatement', kind:'stats', name:'Proof Statement', description:'One oversized social-proof or numerical statement with minimal supporting context.', source:'shared', reusable:true, aiPurpose:'Use one memorable proof signal rather than a dashboard of metrics.' },
  { id:'immersive.conversionFinale', kind:'cta', name:'Conversion Finale', description:'Minimal closing conversion panel with one primary next step.', source:'shared', reusable:true, aiPurpose:'End with a clean, high-confidence invitation and remove competing choices.' },
];

const KIND_BY_ID: Record<(typeof EA_IMMERSIVE_SECTION_IDS)[number], WebsiteSectionKind> = {
  'immersive.hero':'hero',
  'immersive.editorialFeature':'content',
  'immersive.productStage':'features',
  'immersive.cinematicMedia':'media',
  'immersive.benefitPair':'features',
  'immersive.trustStory':'features',
  'immersive.proofStatement':'stats',
  'immersive.conversionFinale':'cta',
};

export function eaImmersivePageTemplate(input:{ id:string; name:string; organizationId?:string; themeId?:string }): WebsitePageManifest {
  return {
    id: input.id,
    name: input.name,
    organizationId: input.organizationId,
    themeId: input.themeId || 'ea-immersive',
    sections: EA_IMMERSIVE_SECTION_IDS.map((sectionId, order) => ({
      sectionId, kind: KIND_BY_ID[sectionId], order, enabled: true,
    })),
  };
}
