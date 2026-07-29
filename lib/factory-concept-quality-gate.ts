/**
 * Concept quality gates:
 * 1) Opportunity Intelligence Brief™ render brand gate (existing)
 * 2) UXG Ready-for-review gate for researched content packages (new)
 */
import type { ConceptRenderBrand } from '@/lib/factory-concept-renders';
import {
  containsForbiddenPublicCopy,
  findForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import type { ContentPackage } from '@/lib/factory-content-package';
import type { ConceptPreviewsPayload } from '@/lib/factory-concept-previews';

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
    memberPersona:
      brand.memberPersona && !FORBIDDEN.test(brand.memberPersona)
        ? brand.memberPersona
        : 'Member',
    memberTiles:
      tiles.length >= 4
        ? tiles
        : ['Messages', 'Upcoming Events', 'Resources', 'Tasks', 'Progress', 'Announcements'],
  };
}

export type ConceptQualityGateResult =
  | { ok: true; reasons: string[] }
  | { ok: false; reasons: string[] };

/**
 * UXG content safety gate — blocks Ready for review when previews are placeholders.
 */
export function evaluateConceptQualityGate(input: {
  contentPackage: ContentPackage | null;
  previews: ConceptPreviewsPayload | null;
}): ConceptQualityGateResult {
  const reasons: string[] = [];
  const pack = input.contentPackage;
  if (!pack) {
    reasons.push('Research content package is missing.');
    return { ok: false, reasons };
  }
  if (!pack.quality.ready) {
    reasons.push(
      ...(pack.quality.missing.length ? pack.quality.missing : ['Content package is not ready.']),
    );
  }
  if (pack.quality.factCount < 3) {
    reasons.push('Need at least three meaningful verified facts.');
  }
  if (
    pack.quality.sourceCount < 2 &&
    pack.claims.filter((c) => c.status === 'admin_clarification').length < 1
  ) {
    reasons.push('Need at least two credible sources.');
  }
  if ((pack.biography || '').length < 40) {
    reasons.push('Need a subject-specific About / Story narrative.');
  }

  const forbiddenInPack = findForbiddenPublicCopy(pack);
  if (!forbiddenInPack.ok) {
    reasons.push(`Forbidden copy in content package: ${forbiddenInPack.matches[0]}`);
  }

  const previews = input.previews;
  if (!previews?.previews?.length) {
    reasons.push('Website and portal preview drafts are missing.');
  } else {
    if (previews.previews.length < 3) {
      reasons.push('Need three distinct concepts.');
    }
    const signatures = new Set(
      previews.previews.map(
        (p) => `${p.lens}:${p.compositionSignature || p.conceptId}`,
      ),
    );
    if (signatures.size < Math.min(3, previews.previews.length)) {
      reasons.push('Concepts must be materially different in composition.');
    }
    for (const preview of previews.previews) {
      if (containsForbiddenPublicCopy(preview.name)) {
        reasons.push(`Concept name contains forbidden copy: ${preview.name}`);
      }
      if (preview.websitePreviewPath.includes('/sites/')) {
        reasons.push('Website preview path must not point at unpublished /sites routes.');
      }
      if (!preview.websitePreviewPath.includes('/preview/factory/')) {
        reasons.push('Website preview route is invalid.');
      }
      if (!preview.portalPreviewPath.includes('/preview/factory/')) {
        reasons.push('Portal preview route is invalid.');
      }
      const shellScan = findForbiddenPublicCopy(preview.portalShell);
      if (!shellScan.ok) {
        reasons.push(`Portal shell contains forbidden copy: ${shellScan.matches[0]}`);
      }
    }
  }

  const unique = [...new Set(reasons)];
  return unique.length ? { ok: false, reasons: unique } : { ok: true, reasons: [] };
}
