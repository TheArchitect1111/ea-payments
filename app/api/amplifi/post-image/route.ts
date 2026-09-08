import { NextRequest } from 'next/server';
import { renderSocialCard, type CreativeBrief, type CreativeFormat, type CreativeSpecification } from '@/lib/creative-foundry';

export const dynamic = 'force-dynamic';

function clean(value: string | null, fallback: string, max = 220) {
  return String(value || fallback).replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeHex(value: string | null, fallback: string) {
  const candidate = String(value || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(candidate) ? candidate : fallback;
}

function normalizeFormat(value: string | null): CreativeFormat {
  return value === 'portrait' || value === 'story' || value === 'landscape' ? value : 'square';
}

function dimensions(format: CreativeFormat) {
  if (format === 'portrait') return { width: 1080, height: 1350, ratio: '4:5' };
  if (format === 'story') return { width: 1080, height: 1920, ratio: '9:16' };
  if (format === 'landscape') return { width: 1200, height: 630, ratio: '1.91:1' };
  return { width: 1080, height: 1080, ratio: '1:1' };
}

export async function GET(req: NextRequest) {
  const format = normalizeFormat(req.nextUrl.searchParams.get('format'));
  const size = dimensions(format);
  const title = clean(req.nextUrl.searchParams.get('title'), 'Your next message', 100);
  const subhead = clean(req.nextUrl.searchParams.get('subhead'), '', 160);
  const objective = clean(req.nextUrl.searchParams.get('objective'), 'Move the audience toward the next useful action.', 120);
  const brandName = clean(req.nextUrl.searchParams.get('brand'), 'Amplifi', 60);
  const cta = clean(req.nextUrl.searchParams.get('cta'), '', 70);
  const layout = clean(req.nextUrl.searchParams.get('layout'), 'editorial-hero', 50);

  const brief: CreativeBrief = {
    id: `amplifi-render-${Date.now().toString(36)}`,
    brand: {
      brandId: 'amplifi-runtime',
      name: brandName,
      primaryColor: safeHex(req.nextUrl.searchParams.get('primary'), '#0b0b0c'),
      accentColor: safeHex(req.nextUrl.searchParams.get('accent'), '#ffffff'),
    },
    objective,
    audience: 'Campaign audience',
    message: title,
    callToAction: cta || undefined,
  };

  const spec: CreativeSpecification = {
    id: `${brief.id}-card`,
    briefId: brief.id,
    format,
    sourceKind: 'graphic-only',
    headline: title,
    subhead: subhead || undefined,
    callToAction: cta || undefined,
    visualDirection: 'Deterministic premium social graphic rendered by the shared EA Creative Foundry.',
    layoutFamily: layout,
    aspectRatio: size.ratio,
    width: size.width,
    height: size.height,
  };

  const response = renderSocialCard(brief, spec);
  response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  response.headers.set('X-EA-Creative-Foundry', 'v1');
  return response;
}
