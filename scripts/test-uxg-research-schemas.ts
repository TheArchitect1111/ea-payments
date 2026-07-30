/**
 * Schema + license/usage rule checks for UXG ResearchCrawlResult.
 * Run: npx --yes tsx scripts/test-uxg-research-schemas.ts
 */
import assert from 'node:assert/strict';
import {
  parseResearchCrawlRequest,
  parseResearchCrawlResult,
  scoreResearchCrawlCompleteness,
  RESEARCH_CRAWL_SCHEMA_VERSION,
} from '../lib/uxg/research/schemas';

const sample = parseResearchCrawlResult({
  schemaVersion: RESEARCH_CRAWL_SCHEMA_VERSION,
  identity: {
    canonicalName: 'Brickey Botanicals',
    entityType: 'organization',
    geography: ['North Carolina'],
    officialDomains: ['brickeybotanicals.com'],
    socialProfiles: [],
    identityVerified: true,
    identityStatus: 'resolved',
    employerAffiliated: false,
    rejectedDomains: [],
  },
  evidence: [
    {
      claim: 'Brickey Botanicals grows small-batch botanical products.',
      category: 'product',
      sourceUrl: 'https://brickeybotanicals.example/about',
      retrievedAt: new Date().toISOString(),
      confidence: 0.8,
      independentlyCorroborated: false,
    },
  ],
  organization: {
    mission: 'Botanical craft',
    services: ['Skincare', 'Herbal teas'],
    audiences: ['Wellness shoppers'],
    history: [],
    locations: ['North Carolina'],
    leadership: [],
    contactPaths: ['mailto:hello@brickeybotanicals.com'],
    callsToAction: ['Shop now'],
  },
  brandAssets: [
    {
      kind: 'logo',
      value: 'https://brickeybotanicals.com/logo.svg',
      sourceUrl: 'https://brickeybotanicals.com/',
      confidence: 0.8,
      consistentAcrossSources: false,
      ownership: 'subject_owned',
    },
    {
      kind: 'color',
      value: '#2f5d3a',
      sourceUrl: 'https://brickeybotanicals.com/',
      confidence: 0.4,
      consistentAcrossSources: false,
      ownership: 'subject_owned',
    },
    {
      kind: 'color',
      value: '#2f5d3a',
      sourceUrl: 'https://brickeybotanicals.com/about',
      confidence: 0.4,
      consistentAcrossSources: true,
      ownership: 'subject_owned',
    },
  ],
  mediaAssets: [
    {
      originalUrl: 'https://brickeybotanicals.com/hero.jpg',
      pageUrl: 'https://brickeybotanicals.com/',
      usageStatus: 'preview_only',
      relevanceCategory: 'product',
      rejected: false,
      ownership: 'subject_owned',
      licenseEvidence: 'official-site-discovered; not publication-licensed by default',
    },
  ],
  documents: [],
  diagnostics: {
    pagesFetched: 2,
    pagesFailed: 0,
    retries: 0,
    durationMs: 1200,
    errors: [],
    provider: 'crawl4ai',
  },
  job: {
    jobId: 'test-1',
    status: 'succeeded',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    attempt: 1,
  },
});

assert.equal(sample.mediaAssets[0]!.usageStatus, 'preview_only');
assert.ok(sample.evidence[0]!.sourceUrl.startsWith('https://'));
const score = scoreResearchCrawlCompleteness(sample);
assert.ok(score.score > 0.4);

const req = parseResearchCrawlRequest({
  subjectName: 'Ascension Circle',
  candidateUrls: ['https://example.org'],
  maxPages: 5,
});
assert.equal(req.maxPages, 5);

console.log(JSON.stringify({ ok: true, completeness: score }, null, 2));
