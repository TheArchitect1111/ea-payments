import fs from 'node:fs';
import assert from 'node:assert/strict';

const route = fs.readFileSync('app/api/creative-studio/design-studio/route.ts', 'utf8');
const persistence = fs.readFileSync('lib/creative-studio/persistence.ts', 'utf8');

const has = (source, text, label) => assert.ok(source.includes(text), `Missing ${label}: ${text}`);

has(route, 'guardAdminApi(req)', 'existing EA admin API guard');
has(route, "'https://cc.efficiencyarchitects.online'", 'Design Studio production origin');
has(route, "'Access-Control-Allow-Credentials': 'true'", 'credentialed CORS');
has(route, "recordType: 'experience'", 'existing Creative Studio record type');
has(route, "id: RECORD_ID", 'stable registry record id');
has(route, "title: 'EA Design Studio Production Records'", 'registry title');
has(route, 'loadStudioRecordFromAirtable', 'durable read verification');
has(route, 'persistedToAirtable', 'durable write gate');
has(route, "if (!Array.isArray(body.records))", 'registry payload validation');
has(route, 'EA_INTERNAL_ORG_ID', 'configured organization fallback');
has(persistence, "process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio'", 'existing Creative Studio Airtable table');
has(persistence, "'Payload JSON': payload", 'Airtable payload persistence');
has(persistence, "'Record Key': key", 'stable Airtable record key');

assert.ok(!route.includes('BLOB_READ_WRITE_TOKEN'), 'Design Studio registry must not depend on Vercel Blob');
assert.ok(!route.includes('EA_DESIGN_STUDIO_ACCESS_KEY'), 'Design Studio registry must not introduce a parallel access key');

console.log('Design Studio registry API contract passed');
