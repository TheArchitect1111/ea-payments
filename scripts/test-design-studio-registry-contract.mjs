import fs from 'node:fs';
import assert from 'node:assert/strict';

const route = fs.readFileSync('app/api/creative-studio/design-studio/route.ts', 'utf8');
const persistence = fs.readFileSync('lib/creative-studio/persistence.ts', 'utf8');
const twinCity = fs.readFileSync('lib/studio/projects/twin-city-golf.ts', 'utf8');
const flyer = fs.readFileSync('app/twin-city-kappas/golf/flyer/page.tsx', 'utf8');

const has = (source, text, label) => assert.ok(source.includes(text), `Missing ${label}: ${text}`);

has(route, 'guardAdminApi(req)', 'existing EA admin API guard');
has(route, "'https://cc.efficiencyarchitects.online'", 'Command Center production origin');
has(route, "'https://www.efficiencyarchitects.online'", 'EA website production origin');
has(route, "'https://efficiencyarchitects.online'", 'EA root production origin');
has(route, "'Access-Control-Allow-Credentials': 'true'", 'credentialed CORS');
has(route, 'export async function OPTIONS', 'CORS preflight');
has(route, "recordType: 'experience'", 'existing Creative Studio record type');
has(route, 'recordIdFor(orgId)', 'tenant-scoped registry record id');
has(route, "title: 'EA Design Studio Production Records'", 'registry title');
has(route, 'loadStudioRecordFromAirtable', 'durable read verification');
has(route, '!result.ok || !result.persistedToAirtable', 'durable write gate');
has(route, "if (!Array.isArray(body.records))", 'registry payload validation');
has(route, 'EA_INTERNAL_ORG_ID', 'configured organization fallback');
has(persistence, "process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio'", 'existing Creative Studio Airtable table');
has(persistence, "'Payload JSON': payload", 'Airtable payload persistence');
has(persistence, "'Record Key': key", 'stable Airtable record key');

[
  'Thursday, March 11, 2027',
  '8:00 AM',
  'Winston Lake Golf Course',
  '$85 per player',
  '2-man team format',
  'Held in conjunction with the Kappa Provincial Meeting',
].forEach((fact) => has(twinCity, fact, `Twin City verified fact ${fact}`));
has(flyer, '<strong>11</strong>', 'Twin City flyer March 11 date');
has(flyer, '<b>Thursday, March 11, 2027</b>', 'Twin City flyer full verified date');
assert.ok(!flyer.includes('March 12 is the working tournament date'), 'Twin City flyer must not retain obsolete March 12 working-date copy');

assert.ok(!route.includes('BLOB_READ_WRITE_TOKEN'), 'Design Studio registry must not depend on Vercel Blob');
assert.ok(!route.includes('EA_DESIGN_STUDIO_ACCESS_KEY'), 'Design Studio registry must not introduce a parallel access key');
assert.ok(!route.includes('api.airtable.com'), 'Route must reuse Creative Studio persistence helpers');

console.log('Design Studio registry + Twin City regression contract passed');
