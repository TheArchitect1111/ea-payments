import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditEvidenceRecord,
  evaluateAccessibilityAudit,
  evaluateAnonymousPortalDenial,
  evaluateFormAudit,
  evaluateLinkAudit,
  evaluatePerformanceAudit,
  evaluateSeoAudit,
} from '../lib/launch-certification/website-audit.mjs';

test('link evidence fails when destinations, accessible names, anchors, or internal routes are broken', () => {
  assert.equal(evaluateLinkAudit({ links: [] }).status, 'failed');
  assert.equal(evaluateLinkAudit({ links: [{ href: '', hasAccessibleName: false }] }).status, 'failed');
  assert.equal(evaluateLinkAudit({ links: [{ href: 'https://x.test', hasAccessibleName: true }], brokenInternal: [{ href: '/', status: 404 }] }).status, 'failed');
  assert.equal(evaluateLinkAudit({ links: [{ href: '#missing', hasAccessibleName: true }], unresolvedFragments: ['#missing'] }).status, 'failed');
  assert.equal(evaluateLinkAudit({ links: [{ href: 'https://example.test/about', hasAccessibleName: true }], probeLimitExceeded: true }).status, 'unverified');
  assert.equal(evaluateLinkAudit({ links: [{ href: 'https://example.test/about', hasAccessibleName: true, sameOrigin: true, probed: true }] }).status, 'passed');
});

test('form structure never claims delivery without a safe submission receipt', () => {
  assert.equal(evaluateFormAudit([]).status, 'failed');
  const structure = evaluateFormAudit([{ hasSubmitControl: true, fields: [{ name: 'email', type: 'email', hasAccessibleName: true }] }]);
  assert.equal(structure.status, 'unverified');
  assert.equal(structure.details.submissionPerformed, false);
  assert.equal(evaluateFormAudit([{ hasSubmitControl: false, fields: [{ name: '', type: 'text', hasAccessibleName: false }] }]).status, 'failed');
});

test('automated accessibility violations fail and clean axe results pass', () => {
  assert.equal(evaluateAccessibilityAudit([]).status, 'passed');
  const result = evaluateAccessibilityAudit([{ id: 'color-contrast', impact: 'serious', help: 'Elements must have sufficient color contrast', nodes: [{}, {}] }]);
  assert.equal(result.status, 'failed');
  assert.match(result.reason, /1 violation/);
  assert.equal(result.details.violations[0].nodes.length, 2);
  const detailed = evaluateAccessibilityAudit([{ id: 'color-contrast', nodes: [{ target: ['.hero-copy'], failureSummary: 'Fix contrast' }] }]);
  assert.deepEqual(detailed.details.violations[0].nodes[0], { target: ['.hero-copy'], failureSummary: 'Fix contrast' });
});

test('anonymous portal denial can pass only for a configured denial route and cannot imply roles or tenant isolation', () => {
  const result = evaluateAnonymousPortalDenial({
    responseStatus: 200,
    requestedUrl: 'https://client.test/portal/private',
    finalUrl: 'https://client.test/portal/login?next=%2Fportal%2Fprivate',
    expectedDeniedPath: '/portal/login',
    expectedQuery: { next: '/portal/private' },
  });
  assert.equal(result.status, 'passed');
  assert.match(result.details.scope, /authenticated roles, tenant isolation/);
  assert.equal(evaluateAnonymousPortalDenial({
    responseStatus: 200,
    requestedUrl: 'https://client.test/portal/private',
    finalUrl: 'https://client.test/portal/private',
    expectedDeniedPath: '/portal/login',
  }).status, 'failed');
});

test('SEO evidence checks discoverable metadata and production indexability', () => {
  const good = { title: 'An excellent title for this site', description: 'A sufficiently descriptive search result summary that is longer than fifty characters.', canonical: 'https://example.test/page', canonicalValid: true, h1Count: 1, noindex: false };
  assert.equal(evaluateSeoAudit(good, { environment: 'preview' }).status, 'passed');
  assert.equal(evaluateSeoAudit({ ...good, noindex: true }, { environment: 'preview' }).status, 'passed');
  assert.equal(evaluateSeoAudit({ ...good, noindex: true }, { environment: 'production' }).status, 'failed');
  assert.equal(evaluateSeoAudit({ ...good, h1Count: 2 }).status, 'failed');
});

test('performance evidence requires desktop/mobile web-vitals and applies explicit thresholds', () => {
  assert.equal(evaluatePerformanceAudit([]).status, 'unverified');
  assert.equal(evaluatePerformanceAudit([
    { route: '/', viewport: 'desktop', dclMs: 1000, lcpMs: 1500, cls: 0.02 },
    { route: '/', viewport: 'mobile', dclMs: 2000, lcpMs: 3500, cls: 0.09 },
  ]).status, 'passed');
  assert.equal(evaluatePerformanceAudit([{ route: '/', viewport: 'mobile', dclMs: 6000, lcpMs: 5000, cls: 0.2 }]).status, 'failed');
});

test('browser evidence is commit/environment bound and includes an artifact reference', () => {
  const row = auditEvidenceRecord({
    checkId: 'website:seo',
    result: { status: 'passed', reason: '', details: { route: '/' } },
    sourceCommit: 'a'.repeat(40), environment: 'preview', timestamp: '2026-10-29T17:00:00.000Z', evidenceRef: 'artifacts/website-audit.json#website%3Aseo', deploymentId: 'dpl_preview',
  });
  assert.equal(row.status, 'passed');
  assert.equal(row.sourceCommit, 'a'.repeat(40));
  assert.equal(row.environment, 'preview');
  assert.equal(row.evidenceRef, 'artifacts/website-audit.json#website%3Aseo');
  assert.equal(row.evidenceType, 'live-browser-audit');
  assert.equal(row.deploymentId, 'dpl_preview');
  assert.deepEqual(row.auditDetails, { route: '/' });
});
