export type ApprovedVisualSurface = {
  id: string;
  clientId: string;
  route: string;
  baselineRef: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  allowedChangeRegions: string[];
  protectedRegions: string[];
  maxDiffPixelRatio: number;
  status: 'APPROVED' | 'RETIRED';
};

export type VisualComparisonEvidence = {
  surfaceId: string;
  candidateRef: string;
  baselineRef: string;
  viewport: string;
  expectedImageRef: string;
  actualImageRef: string;
  diffImageRef?: string;
  diffPixelRatio: number;
  passed: boolean;
};

export function assertVisualSurfaceSafe(surface: ApprovedVisualSurface): void {
  if (!surface.clientId || !surface.id || !surface.route) throw new Error('Visual surface identity is required.');
  if (!surface.baselineRef) throw new Error('Approved visual surface requires an immutable baseline ref.');
  if (!surface.viewports.length) throw new Error('Approved visual surface requires at least one viewport.');
  if (surface.maxDiffPixelRatio < 0 || surface.maxDiffPixelRatio > 1) throw new Error('Invalid visual diff threshold.');
  const overlap = surface.allowedChangeRegions.filter((region) => surface.protectedRegions.includes(region));
  if (overlap.length) throw new Error(`Visual region cannot be both allowed and protected: ${overlap.join(', ')}`);
}

export function evaluateVisualEvidence(
  surface: ApprovedVisualSurface,
  evidence: VisualComparisonEvidence[],
): { passed: boolean; failures: string[] } {
  assertVisualSurfaceSafe(surface);
  if (surface.status !== 'APPROVED') return { passed: false, failures: ['surface is not APPROVED'] };
  const failures: string[] = [];
  for (const viewport of surface.viewports) {
    const item = evidence.find((entry) => entry.viewport === viewport.name && entry.surfaceId === surface.id);
    if (!item) {
      failures.push(`missing visual evidence for ${viewport.name}`);
      continue;
    }
    if (item.baselineRef !== surface.baselineRef) failures.push(`baseline mismatch for ${viewport.name}`);
    if (!item.expectedImageRef || !item.actualImageRef) failures.push(`missing image refs for ${viewport.name}`);
    if (!item.passed || item.diffPixelRatio > surface.maxDiffPixelRatio) failures.push(`visual regression for ${viewport.name}`);
  }
  return { passed: failures.length === 0, failures };
}

export const RUN2_VISUAL_INVARIANTS = Object.freeze([
  'visual baseline is tied to an immutable approved ref',
  'candidate cannot update its own approved baseline',
  'all configured viewports require evidence',
  'missing visual evidence fails closed',
  'visual PASS is independent of the worker that produced the change',
]);
