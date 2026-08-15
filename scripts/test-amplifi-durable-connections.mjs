import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [migration, store, callback, list, publish] = await Promise.all([
  read('supabase/migrations/011_amplifi_social_connections.sql'),
  read('lib/amplifi-connection-store.ts'),
  read('app/api/portal/amplifi/native-connections/[provider]/callback/route.ts'),
  read('app/api/portal/amplifi/native-connections/route.ts'),
  read('app/api/portal/amplifi/native-publish/route.ts'),
]);

assert.match(migration, /primary key \(portal_slug, provider\)/);
assert.match(migration, /revoke all .* from anon, authenticated/);
assert.match(store, /encryptAccounts\(accounts\)/);
assert.match(store, /isSupabaseReady\(\)/);
assert.match(store, /AIRTABLE_AMPLIFI_CONNECTIONS_TABLE_ID/);
assert.match(store, /loadFromAirtable\(portalSlug, provider\)/);
assert.match(store, /saveToAirtable\(portalSlug, provider, accounts\)/);
assert.match(callback, /saveAmplifiConnections\(signedState!\.portalSlug/);
assert.match(list, /loadAmplifiConnections\(auth\.session\.slug\)/);
assert.match(list, /One-time migration/);
assert.match(publish, /loadAmplifiConnections\(auth\.session\.slug\)/);

console.log('Amplifi durable connection contract: PASS');
