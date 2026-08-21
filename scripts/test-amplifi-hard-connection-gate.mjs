import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/amplifi/AmplifiPostApp.tsx', 'utf8');
const home = readFileSync('app/amplifi/AmplifiHome.tsx', 'utf8');
const connectionsRoute = readFileSync('app/api/portal/amplifi/native-connections/route.ts', 'utf8');
const campaignRoute = readFileSync('app/api/portal/amplifi/create-campaign/route.ts', 'utf8');
const researchRoute = readFileSync('app/api/portal/amplifi/topic-research/route.ts', 'utf8');
const watchRoute = readFileSync('app/api/portal/amplifi/topic-research/watch/route.ts', 'utf8');

assert.match(connectionsRoute, /!auth\.session\.slug\.startsWith\('amplifi-trial-'\)/, 'Trials must not migrate another tenant social cookie');
assert.match(home, /connectedChannels\.length === 0[\s\S]*Connect your social accounts[\s\S]*Connect accounts/, 'Zero-connection home must show only the connection step');
assert.match(home, /ConnectionStatus[\s\S]*Choose an Amplifi path/, 'Connection confirmation must appear before Options 1, 2 and 3');
assert.match(app, /connectionsLoading \|\| socialConnections\.length === 0/, 'Path selection must remain locked while loading or disconnected');
assert.match(app, /requiresConnection[\s\S]*setShowHome\(true\)/, 'Direct workspace navigation must return disconnected users home');
assert.match(app, /socialConnections\.length > 0 \|\| !selectedPath[\s\S]*setSelectedPath\(null\)/, 'Removing the last connection must relock the workspace');

for (const [name, source] of Object.entries({ campaignRoute, researchRoute, watchRoute })) {
  assert.match(source, /loadAmplifiConnections\(auth\.session\.slug\)/, `${name} must verify the current tenant connection`);
  assert.match(source, /connections\.length === 0/, `${name} must reject disconnected creation`);
  assert.match(source, /status: 409/, `${name} must return a connection-required response`);
}

console.log('Amplifi requires a verified tenant connection before Options 1, 2 or 3.');
