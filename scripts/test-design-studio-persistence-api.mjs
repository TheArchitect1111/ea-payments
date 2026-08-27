import fs from 'node:fs';
import assert from 'node:assert/strict';

const routePath = 'app/api/creative-studio/design-studio/route.ts';
const route = fs.readFileSync(routePath, 'utf8');
const persistence = fs.readFileSync('lib/creative-studio/persistence.ts', 'utf8');

const has = (source, text, label) => assert.ok(source.includes(text), `Missing ${label}: ${text}`);

has(route, 'guardAdminApi(req)', 'standard EA admin guard');
has(route, "loadStudioRecordFromAirtable", 'durable Airtable read');
has(route, "saveStudioRecord", 'Creative Studio persistence write');
has(route, "recordType: 'experience'", 'existing Creative Studio record type');
has(route, "design-studio-production-records-v1", 'stable Design Studio record key');
has(route, "persistedToAirtable", 'durable-write enforcement');
has(route, "Access-Control-Allow-Credentials", 'credentialed CORS');
has(route, "https://www.efficiencyarchitects.online", 'www EA origin');
has(route, "https://cc.efficiencyarchitects.online", 'command-center EA origin');
has(route, "export async function OPTIONS", 'CORS preflight');
has(route, "Array.isArray(body.records)", 'records payload validation');
has(route, "auth.user.orgId", 'authenticated organization scope');
has(persistence, "airtableUpsertByField", 'existing Airtable upsert primitive');
has(persistence, "loadStudioRecordFromAirtable", 'existing durable-load primitive');

assert.ok(!route.includes('AIRTABLE_API_KEY'), 'Route must not bypass Creative Studio persistence helpers');
assert.ok(!route.includes('api.airtable.com'), 'Route must not call Airtable directly');

console.log('Design Studio persistence API contract passed');
