/**
 * Visual quality gate for Opportunity Intelligence Brief™ concept renders.
 * Rejects placeholder / wireframe language before Resend.
 */
import type { ConceptRenderBrand } from '@/lib/factory-concept-renders';

const FORBIDDEN =
  /\b(your organization|lorem|placeholder|card\s*1|sample text|coming soon|tbd|todo)\b/i;

export type ConceptQualityResult = {
  ok: boolean;
  reasons: string[];
};

export function evaluateConceptRenderInputs(brand: ConceptRenderBrand): ConceptQualityResult {
  const reasons: string[] = [];
  const name = (brand.clientName || '').trim();
  const headline = (brand.headline || brand.tagline || '').trim();
  const story = (brand.story || brand.tagline || '').trim();

  if (!name || FORBIDDEN.test(name) || /^client$/i.test(name)) {
    reasons.push('missing or placeholder client name');
  }
  if (!brand.primaryColor || !/^#[0-9a-f]{3,8}$/i.test(brand.primaryColor)) {
    reasons.push('missing primary color');
  }
  if (!headline || FORBIDDEN.test(headline) || headline.length < 8) {
    reasons.push('missing or weak headline');
  }
  if (FORBIDDEN.test(story)) {
    reasons.push('placeholder language in story');
  }
  if (FORBIDDEN.test(brand.cta || '')) {
    reasons.push('placeholder CTA');
  }

  const modules = brand.portalModules || [];
  if (!modules.length) {
    reasons.push('missing portal modules');
  } else if (modules.length === 1 && /^dashboard$/i.test(modules[0])) {
    reasons.push('Dashboard as sole portal title');
  }
  for (const mod of modules) {
    if (FORBIDDEN.test(mod) || /^card\s*\d+$/i.test(mod) || /^people$/i.test(mod)) {
      reasons.push(`weak portal module: ${mod}`);
      break;
    }
  }

  const tiles = brand.memberTiles || [];
  if (!tiles.length) {
    reasons.push('missing member tiles');
  }
  for (const tile of tiles) {
    if (FORBIDDEN.test(tile) || /^card\s*\d+$/i.test(tile)) {
      reasons.push(`weak member tile: ${tile}`);
      break;
    }
  }

  if (!brand.memberPersona?.trim() || FORBIDDEN.test(brand.memberPersona)) {
    reasons.push('missing member persona');
  }

  return { ok: reasons.length === 0, reasons };
}

/** Tighten inputs for a single regenerate pass. */
export function tightenConceptRenderBrand(brand: ConceptRenderBrand): ConceptRenderBrand {
  const name = brand.clientName.trim();
  const safeName =
    !name || FORBIDDEN.test(name) || /^client$/i.test(name) ? 'Community Organization' : name;
  const modules = (brand.portalModules || []).filter(
    (m) => m && !FORBIDDEN.test(m) && !/^dashboard$/i.test(m) && !/^people$/i.test(m),
  );
  const tiles = (brand.memberTiles || []).filter((t) => t && !FORBIDDEN.test(t));
  const headline =
    brand.headline && !FORBIDDEN.test(brand.headline) && brand.headline.length >= 8
      ? brand.headline
      : brand.story && !FORBIDDEN.test(brand.story)
        ? brand.story
        : `Built for the people ${safeName} serves`;

  return {
    ...brand,
    clientName: safeName,
    primaryColor: brand.primaryColor || '#1B2B4D',
    accentColor: brand.accentColor || '#C9A844',
    headline: headline.slice(0, 72),
    tagline: (brand.tagline || brand.story || headline).slice(0, 140),
    story: (brand.story || `We help the people ${safeName} serves.`).slice(0, 120),
    cta: brand.cta && !FORBIDDEN.test(brand.cta) ? brand.cta : 'Get started',
    portalModules:
      modules.length >= 4
        ? modules
        : ['Programs', 'Events', 'Messages', 'Reports', 'Tasks', 'People & Care'],
    memberPersona: brand.memberPersona && !FORBIDDEN.test(brand.memberPersona) ? brand.memberPersona : 'Member',
    memberTiles:
      tiles.length >= 4
        ? tiles
        : ['Messages', 'Upcoming Events', 'Resources', 'Tasks', 'Progress', 'Announcements'],
  };
}
