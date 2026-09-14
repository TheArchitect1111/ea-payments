import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RUN2_VISUAL_INVARIANTS,
  assertVisualSurfaceSafe,
  evaluateVisualEvidence,
  type ApprovedVisualSurface,
} from '../lib/execution/approved-visual-baseline';
import {
  RUN2_REPAIR_INVARIANTS,
  decideAutonomousRepair,
} from '../lib/execution/autonomous-repair-policy';
import type { OpenHandsEngineeringTask, OpenHandsEngineeringResult } from '../lib/execution/openhands-worker-boundary';

const surface: ApprovedVisualSurface = {
  id: 'surface-test',
  clientId: 'client-test',
  route: '/test',
  baselineRef: 'approved-sha',
  viewports: [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ],
  allowedChangeRegions: [],
  protectedRegions: ['full-page'],
  maxDiffPixelRatio: 0.001,
  status: 'APPROVED',
};
assert.doesNotThrow(() => assertVisualSurfaceSafe(surface));
assert.ok(RUN2_VISUAL_INVARIANTS.includes('missing visual evidence fails closed'));

const completeVisual = [
  { surfaceId: 'surface-test', candidateRef: 'candidate', baselineRef: 'approved-sha', viewport: 'mobile', expectedImageRef: 'expected-mobile.png', actualImageRef: 'actual-mobile.png', diffImageRef: 'diff-mobile.png', diffPixelRatio: 0, passed: true },
  { surfaceId: 'surface-test', candidateRef: 'candidate', baselineRef: 'approved-sha', viewport: 'desktop', expectedImageRef: 'expected-desktop.png', actualImageRef: 'actual-desktop.png', diffImageRef: 'diff-desktop.png', diffPixelRatio: 0, passed: true },
];
assert.equal(evaluateVisualEvidence(surface, completeVisual).passed, true);
assert.equal(evaluateVisualEvidence(surface, completeVisual.slice(0, 1)).passed, false, 'missing viewport evidence must fail closed');
assert.equal(evaluateVisualEvidence(surface, [{ ...completeVisual[0], baselineRef: 'wrong' }, completeVisual[1]]).passed, false, 'baseline mismatch must fail');

const task: OpenHandsEngineeringTask = {
  executionId: 'exec-run2',
  projectId: 'proj-run2',
  clientId: 'client-test',
  repository: 'TheArchitect1111/ea-payments',
  baseRef: 'master',
  task: 'repair scoped component',
  allowedPaths: ['app/test', 'lib/test'],
  forbiddenPaths: ['.github/workflows', 'lib/execution'],
  acceptanceCriteria: ['tests pass'],
  rollbackTarget: 'approved-sha',
  mode: 'PATCH_ONLY',
};
const workerResult: OpenHandsEngineeringResult = {
  executionId: 'exec-run2',
  status: 'SUCCEEDED',
  changedPaths: ['app/test/page.tsx'],
  patchRef: 'patch-1',
  testCommands: ['npm test'],
  testResults: [{ command: 'npm test', passed: true, summary: 'PASS' }],
  evidenceRefs: ['artifact://run2'],
  notes: [],
};
const ready = decideAutonomousRepair({
  task,
  workerResult,
  opaAllowed: true,
  functionalGatePassed: true,
  tenantIsolationPassed: true,
  rollbackVerified: true,
  productionVerificationRequired: true,
  visualSurface: surface,
  visualEvidence: completeVisual,
});
assert.equal(ready.disposition, 'READY_FOR_HUMAN_OR_RELEASE_GATE');
assert.ok(RUN2_REPAIR_INVARIANTS.includes('successful repair means eligible for independent release gate, never COMPLETE'));

const forbidden = decideAutonomousRepair({
  task,
  workerResult: { ...workerResult, changedPaths: ['.github/workflows/ci.yml'] },
  opaAllowed: true,
  functionalGatePassed: true,
  tenantIsolationPassed: true,
  rollbackVerified: true,
  productionVerificationRequired: true,
  visualSurface: surface,
  visualEvidence: completeVisual,
});
assert.equal(forbidden.disposition, 'BLOCKED');

const manifest = JSON.parse(readFileSync(join(process.cwd(), '.ea/stability/approved-visual-surfaces.v1.json'), 'utf8'));
assert.equal(manifest.schemaVersion, 1);
assert.ok(Array.isArray(manifest.surfaces) && manifest.surfaces.length >= 1, 'at least one protected surface must be registered');
for (const item of manifest.surfaces) assertVisualSurfaceSafe(item);

const playwrightConfig = readFileSync(join(process.cwd(), 'playwright.ece.config.ts'), 'utf8');
assert.match(playwrightConfig, /trace:\s*'retain-on-failure'/, 'visual Playwright config should retain trace on failure');

console.log('EA Stability Run 2 protected autonomy contracts: PASS');
