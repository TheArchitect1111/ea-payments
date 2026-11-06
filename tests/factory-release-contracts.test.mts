import test from 'node:test';
import assert from 'node:assert/strict';
import { postgresPeopleRepository } from '../lib/people/postgres-repository';
import { applyProjectEvidence } from '../lib/project-state-engine';
import { createFirecrawlResearchProvider } from '../lib/uxg/research/firecrawl-provider';
import { parseResearchCrawlRequest, parseResearchCrawlResult } from '../lib/uxg/research/schemas';
import { canPublishMediaAsset } from '../lib/experience-creation/openverse-provider';

test('People row mapping preserves nullable metadata and rejects unsupported consent purposes', async () => {
  const names = ['PEOPLE_SUPABASE_URL','PEOPLE_SUPABASE_API_KEY','PEOPLE_SUPABASE_KEY','PEOPLE_SUPABASE_JWT_SECRET'];
  const before = new Map(names.map(name => [name, process.env[name]]));
  const fetchBefore = globalThis.fetch;
  try {
    Object.assign(process.env, { PEOPLE_SUPABASE_URL:'https://people-fixture.invalid', PEOPLE_SUPABASE_API_KEY:'synthetic-gateway', PEOPLE_SUPABASE_KEY:'synthetic-app' });
    delete process.env.PEOPLE_SUPABASE_JWT_SECRET;
    let purpose = 'email_marketing';
    globalThis.fetch = async (target, init) => {
      const url = new URL(String(target));
      assert.equal(url.origin, 'https://people-fixture.invalid');
      assert.equal(url.searchParams.get('person_key'), 'eq.person-fixture');
      assert.equal(new Headers(init?.headers).get('Accept-Profile'), 'people');
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer synthetic-app');
      return Response.json(url.pathname.endsWith('/program_links')
        ? [{ link_key:'link', organization_id:'org-fixture', kind:'other', external_ref:null, status:'active' }]
        : [{ consent_key:'consent', organization_id:'org-fixture', purpose, status:'denied', captured_at:null, source:'staff' }]);
    };
    const repo = postgresPeopleRepository();
    assert.equal((await repo.listProgramLinks('person-fixture'))[0]?.externalRef, '');
    const consent = (await repo.listConsents('person-fixture'))[0]!;
    assert.equal(consent.capturedAt, '');
    assert.equal(consent.status, 'denied');
    purpose = 'unsupported-purpose';
    await assert.rejects(repo.listConsents('person-fixture'), /Invalid stored consent purpose/);
  } finally {
    globalThis.fetch = fetchBefore;
    for (const [name,value] of before) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});

test('Firecrawl output records unknown ownership without publication approval', async () => {
  const before = process.env.FIRECRAWL_API_KEY; const fetchBefore = globalThis.fetch;
  try {
    process.env.FIRECRAWL_API_KEY = 'synthetic-key';
    globalThis.fetch = async target => {
      assert.equal(String(target), 'https://api.firecrawl.dev/v1/scrape');
      return Response.json({ success:true, data:{ markdown:'A synthetic organization with documented public services and contact information. ![Logo](https://fixture.invalid/logo.png) #abcdef', metadata:{ title:'Synthetic', ogImage:'https://fixture.invalid/og.png' } } });
    };
    const result = parseResearchCrawlResult(await createFirecrawlResearchProvider().crawl(parseResearchCrawlRequest({ subjectName:'Synthetic', knownUrls:['https://fixture.invalid'], maxPages:1 })));
    assert.ok(result.mediaAssets.length >= 2);
    assert.ok(result.brandAssets.length >= 2);
    assert.ok(result.mediaAssets.every(asset => asset.ownership === 'unknown' && asset.usageStatus === 'preview_only'));
    assert.ok(result.brandAssets.every(asset => asset.ownership === 'unknown'));
  } finally {
    globalThis.fetch = fetchBefore;
    if (before === undefined) delete process.env.FIRECRAWL_API_KEY; else process.env.FIRECRAWL_API_KEY = before;
  }
});

test('user supplied assets still require human approval and acceptable rights', () => {
  assert.equal(canPublishMediaAsset({ usageStatus:'user_supplied', licenseClass:'public_domain', licenseVerified:true, publicationEligible:true }).ok, false);
  assert.equal(canPublishMediaAsset({ usageStatus:'approved', licenseClass:'unclear', licenseVerified:true, publicationEligible:true }).ok, false);
});

test('project evidence accepts an absent initial state without skipping lifecycle steps', () => {
  const result = applyProjectEvidence({ stage:'Discovery' }, [], '2026-11-06T00:00:00.000Z');
  assert.equal(result.stage, 'Discovery');
});
