import fs from 'node:fs';

const source = fs.readFileSync('lib/execution/operational-nervous-system.ts', 'utf8');
const stack = JSON.parse(fs.readFileSync('config/ea-run3-operational-stack.json', 'utf8'));

const requiredSource = [
  'validateOperationalEvent',
  'validateReleaseControl',
  'validateExternalAutomationEnvelope',
  "'KILL_SWITCH'",
  'idempotencyKey',
  'rollbackTarget',
  'approvedBy',
  'EA_RUN3_INVARIANTS',
];
for (const token of requiredSource) {
  if (!source.includes(token)) throw new Error(`Run 3 source missing ${token}`);
}

if (stack.observability.standard !== 'OpenTelemetry') throw new Error('OpenTelemetry must be the observability standard');
if (!stack.observability.signals.includes('traces') || !stack.observability.signals.includes('metrics') || !stack.observability.signals.includes('logs')) throw new Error('all three telemetry signals required');
if (stack.observability.deploymentAuthority !== false) throw new Error('observability cannot deploy');
if (stack.featureManagement.applicationApi !== 'OpenFeature') throw new Error('OpenFeature application API required');
if (stack.featureManagement.providerTarget !== 'Unleash') throw new Error('Unleash provider target required');
if (stack.featureManagement.productionDefault !== 'OFF') throw new Error('production feature state must fail closed');
if (!stack.featureManagement.modes.includes('KILL_SWITCH')) throw new Error('kill switch required');
if (stack.externalAutomation.connector !== 'Activepieces') throw new Error('Activepieces connector required');
if (stack.externalAutomation.directProductionAuthority !== false) throw new Error('Activepieces cannot have direct production authority');
for (const field of ['tenantId', 'projectId', 'correlationId', 'idempotencyKey', 'allowedCapabilities']) {
  if (!stack.externalAutomation.requiredEnvelope.includes(field)) throw new Error(`external automation envelope missing ${field}`);
}

console.log('EA Stability Run 3 operational nervous system contract: PASS');
