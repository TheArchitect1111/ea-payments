/**
 * Contract: Simplifi OS foundation scaffolding exists and capture hooks in.
 * Does not require live Supabase.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const migrations = [
  'supabase/migrations/001_simplifi_objects.sql',
  'supabase/migrations/002_simplifi_memory_events.sql',
  'supabase/migrations/003_simplifi_embeddings_relationships.sql',
  'supabase/migrations/004_simplifi_intelligence.sql',
  'supabase/migrations/005_simplifi_sync_outbox.sql',
];

for (const m of migrations) {
  assert.ok(fs.existsSync(path.join(root, m)), `missing ${m}`);
}

const mem = read('supabase/migrations/002_simplifi_memory_events.sql');
assert.match(mem, /simplifi_memory_events/);
assert.match(mem, /actor_id/);
assert.match(mem, /related_object_ids/);

const emb = read('supabase/migrations/003_simplifi_embeddings_relationships.sql');
assert.match(emb, /create extension if not exists vector/i);
assert.match(emb, /simplifi_embeddings/);
assert.doesNotMatch(emb, /apache.?age|neo4j/i);

const osIndex = read('lib/simplifi-os/index.ts');
assert.match(osIndex, /recordMemoryEvent/);
assert.match(osIndex, /afterCaptureOsWrite/);

const pipeline = read('lib/capture-pipeline.ts');
assert.match(pipeline, /afterCaptureOsWrite/);
assert.match(pipeline, /@\/lib\/simplifi-os/);

const arch = read('docs/SIMPLIFI-OPPORTUNITY-OS-ARCHITECTURE.md');
assert.match(arch, /Personal Opportunity Operating System/);
assert.match(arch, /Forbidden:\*\* Neo4j|Neo4j/);
assert.match(arch, /Apache AGE/);
assert.match(arch, /lib\/simplifi-os/);
assert.doesNotMatch(read('supabase/migrations/003_simplifi_embeddings_relationships.sql'), /neo4j|apache.?age/i);

console.log('OK simplifi-os foundation contract');
