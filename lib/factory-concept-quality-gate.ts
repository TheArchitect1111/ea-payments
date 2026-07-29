/**
 * Concept quality gate — blocks Ready for review when previews are placeholders.
 */
import {
  containsForbiddenPublicCopy,
  findForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import type { ContentPackage } from '@/lib/factory-content-package';
import type { ConceptPreviewsPayload } from '@/lib/factory-concept-previews';

export type ConceptQualityGateResult =
  | { ok: true; reasons: string[] }
  | { ok: false; reasons: string[] };

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
    reasons.push(...(pack.quality.missing.length ? pack.quality.missing : ['Content package is not ready.']));
  }
  if (pack.quality.factCount < 3) {
    reasons.push('Need at least three meaningful verified facts.');
  }
  if (pack.quality.sourceCount < 2 && pack.claims.filter((c) => c.status === 'admin_clarification').length < 1) {
    reasons.push('Need at least two credible sources.');
  }
  if (!pack.lenses.cinematic.heroHeadline || pack.lenses.cinematic.heroHeadline === pack.name) {
    // still ok if other lens copy is rich — check narrative length
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
      previews.previews.map((p) => p.compositionSignature || p.lens || p.conceptId),
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
      // Scan portal shell copy
      const shellScan = findForbiddenPublicCopy(preview.portalShell);
      if (!shellScan.ok) {
        reasons.push(`Portal shell contains forbidden copy: ${shellScan.matches[0]}`);
      }
    }
  }

  // Deduplicate reasons
  const unique = [...new Set(reasons)];
  return unique.length ? { ok: false, reasons: unique } : { ok: true, reasons: [] };
}
