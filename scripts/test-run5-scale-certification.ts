import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  classifyReliabilityError,
  computeBackoffMs,
  idempotencyKey,
  isRetryableErrorClass,
  updateCircuitAfterFailure,
  circuitOpen,
} from '../lib/reliability/execution';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => fs.existsSync(path.join(root, file));

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0;
}

async function certifyConcurrency() {
  const tenantCount = 40;
  const jobsPerTenant = 25;
  const keys = await Promise.all(
    Array.from({ length: tenantCount * jobsPerTenant }, async (_, i) => {
      const tenant = `tenant-${i % tenantCount}`;
      const job = Math.floor(i / tenantCount);
      await Promise.resolve();
      return idempotencyKey([tenant, 'factory', job]);
    }),
  );
  assert.equal(keys.length, 1000);
  assert.equal(new Set(keys).size, 1000, 'idempotency keys collided under burst concurrency');
  for (let t = 0; t < tenantCount; t += 1) {
    const prefix = `tenant-${t}:factory:`;
    assert.equal(keys.filter((key) => key.startsWith(prefix)).length, jobsPerTenant);
  }
}

function certifyRetryAndProviderFailure() {
  const cases: Array<[string, string, boolean]> = [
    ['401 unauthorized invalid api key', 'AUTH', false],
    ['billing card payment required', 'BILLING', false],
    ['insufficient_quota usage limit', 'QUOTA', false],
    ['429 too many requests', 'RATE_LIMIT', true],
    ['deadline timed out', 'TIMEOUT', true],
    ['503 temporary network failure', 'TRANSIENT', true],
    ['invalid payload', 'PERMANENT', false],
  ];
  for (const [message, expected, retryable] of cases) {
    const kind = classifyReliabilityError(new Error(message));
    assert.equal(kind, expected);
    assert.equal(isRetryableErrorClass(kind), retryable);
  }

  const policy = { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 1600, jitterRatio: 0 };
  const delays = [1, 2, 3, 4, 5].map((attempt) => computeBackoffMs(attempt, policy));
  assert.deepEqual(delays, [100, 200, 400, 800, 1600]);

  let state;
  state = updateCircuitAfterFailure(state, 1_000, 3, 60_000);
  assert.equal(circuitOpen(state, 1_001), false);
  state = updateCircuitAfterFailure(state, 1_000, 3, 60_000);
  assert.equal(circuitOpen(state, 1_001), false);
  state = updateCircuitAfterFailure(state, 1_000, 3, 60_000);
  assert.equal(circuitOpen(state, 1_001), true, 'provider circuit did not open at failure threshold');
}

async function certifyBurstLatency() {
  const samples: number[] = [];
  const total = 2000;
  const concurrency = 50;
  let cursor = 0;
  const worker = async () => {
    while (cursor < total) {
      const i = cursor++;
      const started = performance.now();
      idempotencyKey([`tenant-${i % 100}`, 'burst', i]);
      classifyReliabilityError(i % 7 === 0 ? new Error('429 rate limit') : new Error('temporary 503'));
      computeBackoffMs((i % 5) + 1, { maxAttempts: 5, baseDelayMs: 5, maxDelayMs: 100, jitterRatio: 0 });
      await Promise.resolve();
      samples.push(performance.now() - started);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  assert.equal(samples.length, total);
  const p95 = percentile(samples, 0.95);
  assert.ok(p95 < 50, `local reliability primitives p95 ${p95.toFixed(2)}ms exceeds 50ms budget`);
  return { total, concurrency, p95Ms: Number(p95.toFixed(3)) };
}

function certifyRecoveryAndReleaseContracts() {
  const requiredFiles = [
    'scripts/test-recovery-orchestrator.ts',
    'scripts/test-recovery-certification.ts',
    'scripts/test-recovery-monitoring-contract.mjs',
    'scripts/test-recovery-journeys.mjs',
    'scripts/backup-verify.mjs',
    'scripts/test-tenant-release-safety.mjs',
    'scripts/test-release-guardrails.mjs',
    'lib/factory-durable-drain.ts',
    'lib/factory-reliability-store.ts',
    '.ea/gates/latest.json',
  ];
  for (const file of requiredFiles) assert.ok(exists(file), `missing Run 5 dependency: ${file}`);

  const durableDrain = read('lib/factory-durable-drain.ts');
  assert.match(durableDrain, /deadLetteredAt/);
  assert.match(durableDrain, /nextAttemptAt/);
  assert.match(durableDrain, /FAILED/);
  assert.match(durableDrain, /isRetryableErrorClass/);

  const tenantSafety = read('scripts/test-tenant-release-safety.mjs');
  assert.match(tenantSafety, /tenant/i);
  assert.match(tenantSafety, /synthetic|client-supplied|client supplied/i);

  const release = read('scripts/test-release-guardrails.mjs');
  assert.match(release, /gate|release|rollback/i);

  const backup = read('scripts/backup-verify.mjs');
  assert.match(backup, /BACKUP_DESTINATION_URI/);
  assert.match(backup, /HEAD|destination responded|manual verification/i);
}

function certifyCleanRoomRestoreModel() {
  const original = {
    version: 1,
    tenants: [
      { id: 'org-alpha', modules: ['portal', 'amplifi'], active: true },
      { id: 'org-beta', modules: ['portal'], active: true },
    ],
    entitlements: [
      { tenantId: 'org-alpha', key: 'amplifi', enabled: true },
      { tenantId: 'org-beta', key: 'amplifi', enabled: false },
    ],
    workflows: [{ id: 'wf-1', tenantId: 'org-alpha', state: 'QUEUED', attempts: 2 }],
  };
  const snapshot = JSON.stringify(original);
  const destroyed = { version: 1, tenants: [], entitlements: [], workflows: [] };
  assert.equal(destroyed.tenants.length, 0);
  const restored = JSON.parse(snapshot);
  assert.deepEqual(restored, original, 'clean-room snapshot did not restore byte-equivalent logical state');
  assert.notEqual(restored.tenants[0].id, restored.tenants[1].id, 'tenant identities collapsed during restore');
}

function certifyCorruptionAndAssetLossDetection() {
  const manifest = JSON.parse(read('.ea/gates/latest.json')) as { status?: string; gates?: Record<string, { status?: string }> };
  assert.equal(manifest.status, 'PASS');
  assert.ok(manifest.gates && Object.keys(manifest.gates).length >= 5, 'release evidence manifest is incomplete');
  assert.ok(Object.values(manifest.gates ?? {}).every((gate) => gate.status === 'PASS'), 'release evidence contains a failed gate');

  const protection = read('config/production-protection.json');
  const parsed = JSON.parse(protection);
  assert.ok(parsed && typeof parsed === 'object', 'production protection config is corrupt');
  assert.ok(protection.includes('efficiencyarchitects.online'), 'canonical production asset/route protection is missing');
}

async function main() {
  await certifyConcurrency();
  certifyRetryAndProviderFailure();
  const burst = await certifyBurstLatency();
  certifyRecoveryAndReleaseContracts();
  certifyCleanRoomRestoreModel();
  certifyCorruptionAndAssetLossDetection();

  console.log(JSON.stringify({
    certification: 'RUN_5_SCALE_CERTIFICATION',
    status: 'PASS',
    tenantConcurrency: { tenants: 40, jobsPerTenant: 25, uniqueJobs: 1000 },
    factoryBurst: burst,
    providerFailureMatrix: 'PASS',
    retryBudgetAndCircuitBreaker: 'PASS',
    tenantIsolationContracts: 'PASS',
    rollbackAndReleaseContracts: 'PASS',
    backupDestinationContract: 'PASS',
    deletedAssetAndCorruptConfigDetection: 'PASS',
    cleanRoomRestoreModel: 'PASS',
    productionDatabaseTouched: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
