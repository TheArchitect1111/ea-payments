import {
  buildCreativeProductionPlan,
  type BrandProfile,
  type CreativeBrief,
  type CreativeFormat,
  type CreativeProductionPlan,
  type CreativeSourceKind,
  type CreativeSpecification,
} from '@/lib/creative-foundry';

export type AmplifiCreationMode = 'post' | 'series' | 'campaign';

export type AmplifiCreativeInput = {
  mode: AmplifiCreationMode;
  brand: BrandProfile;
  objective: string;
  audience: string;
  offer?: string;
  message: string;
  callToAction?: string;
  destinationUrl?: string;
  visualDirection?: string;
  imageStyle?: string;
  sourceAssets?: string[];
  seriesCount?: number;
};

export type AmplifiCreativeItem = {
  id: string;
  headline: string;
  caption: string;
  callToAction?: string;
  visualDirection: string;
  format: CreativeFormat;
  layoutFamily: string;
  imageUrl: string;
  foundry: CreativeProductionPlan;
};

function formatSize(format: CreativeFormat) {
  if (format === 'portrait') return { width: 1080, height: 1350, aspectRatio: '4:5' };
  if (format === 'story') return { width: 1080, height: 1920, aspectRatio: '9:16' };
  if (format === 'landscape') return { width: 1200, height: 630, aspectRatio: '1.91:1' };
  if (format === 'short-video') return { width: 1080, height: 1920, aspectRatio: '9:16' };
  if (format === 'carousel') return { width: 1080, height: 1350, aspectRatio: '4:5' };
  return { width: 1080, height: 1080, aspectRatio: '1:1' };
}

function layoutFor(mode: AmplifiCreationMode, format: CreativeFormat, index: number) {
  if (format === 'carousel') return index === 0 ? 'education-carousel' : 'story-proof';
  if (format === 'short-video') return 'story-proof';
  if (mode === 'series') return 'quote-minimal';
  if (mode === 'campaign') return index % 3 === 0 ? 'editorial-hero' : index % 3 === 1 ? 'promotion-offer' : 'story-proof';
  return 'editorial-hero';
}

function sourceKind(input: AmplifiCreativeInput): CreativeSourceKind {
  if (input.sourceAssets?.length) return 'client-asset';
  if (/photo|image|cinematic|editorial|portrait/i.test(input.imageStyle || input.visualDirection || '')) return 'generated-image';
  return 'graphic-only';
}

function socialImageUrl(input: {
  headline: string;
  subhead?: string;
  objective: string;
  callToAction?: string;
  brand: BrandProfile;
  layoutFamily: string;
  format: CreativeFormat;
}) {
  const params = new URLSearchParams({
    title: input.headline,
    objective: input.objective,
    brand: input.brand.name,
    layout: input.layoutFamily,
    format: input.format,
    v: '4',
  });
  if (input.subhead) params.set('subhead', input.subhead);
  if (input.callToAction) params.set('cta', input.callToAction);
  if (input.brand.primaryColor) params.set('primary', input.brand.primaryColor);
  if (input.brand.accentColor) params.set('accent', input.brand.accentColor);
  return `/api/amplifi/post-image?${params.toString()}`;
}

export function buildAmplifiCreativePlan(input: AmplifiCreativeInput, items: Array<{
  headline: string;
  caption: string;
  callToAction?: string;
  visualDirection?: string;
}>): AmplifiCreativeItem[] {
  const brief: CreativeBrief = {
    id: `amplifi-${input.mode}-${Date.now().toString(36)}`,
    brand: input.brand,
    objective: input.objective,
    audience: input.audience,
    offer: input.offer,
    message: input.message,
    callToAction: input.callToAction,
    destinationUrl: input.destinationUrl,
    sourceAssets: input.sourceAssets,
  };

  return items.map((item, index) => {
    const format: CreativeFormat = input.mode === 'series' ? 'portrait' : 'square';
    const size = formatSize(format);
    const layoutFamily = layoutFor(input.mode, format, index);
    const spec: CreativeSpecification = {
      id: `${brief.id}-item-${index + 1}`,
      briefId: brief.id,
      format,
      sourceKind: sourceKind(input),
      headline: item.headline,
      subhead: item.caption.slice(0, 150),
      callToAction: item.callToAction || input.callToAction,
      visualDirection: item.visualDirection || input.visualDirection || 'Premium, emotionally relevant campaign creative.',
      layoutFamily,
      aspectRatio: size.aspectRatio,
      width: size.width,
      height: size.height,
      sequenceIndex: index,
    };
    const foundry = buildCreativeProductionPlan(brief, spec);
    return {
      id: spec.id,
      headline: item.headline,
      caption: item.caption,
      callToAction: item.callToAction || input.callToAction,
      visualDirection: spec.visualDirection,
      format,
      layoutFamily,
      imageUrl: socialImageUrl({
        headline: item.headline,
        subhead: item.caption.slice(0, 150),
        objective: input.objective,
        callToAction: item.callToAction || input.callToAction,
        brand: input.brand,
        layoutFamily,
        format,
      }),
      foundry,
    };
  });
}
