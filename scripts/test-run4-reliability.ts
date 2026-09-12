import assert from 'node:assert/strict';
import {
  classifyReliabilityError,
  computeBackoffMs,
  circuitOpen,
  idempotencyKey,
  isRetryableErrorClass,
  updateCircuitAfterFailure,
} from '../lib/reliability/execution';
import { featureEnabled } from '../lib/reliability/feature-flags';
import { assertNoPublicSecrets } from '../lib/reliability/secrets';
import { getProviderRuntimeHealth, markProviderFailure, markProviderSuccess, providerUsable } from '../lib/ai/provider-runtime-health';

assert.equal(classifyReliabilityError(new Error('429 too many requests')), 'RATE_LIMIT');
assert.equal(classifyReliabilityError(new Error('invalid api key')), 'AUTH');
assert.equal(classifyReliabilityError(new Error('insufficient_quota')), 'QUOTA');
assert.equal(classifyReliabilityError(new Error('billing card required')), 'BILLING');
assert.equal(isRetryableErrorClass('RATE_LIMIT'), true);
assert.equal(isRetryableErrorClass('AUTH'), false);
assert(computeBackoffMs(3) > 0);
assert.equal(idempotencyKey(['Factory Job', 'ABC', 2]), 'factory-job:abc:2');

let circuit = updateCircuitAfterFailure(undefined, 1_000, 2, 60_000);
assert.equal(circuitOpen(circuit, 1_001), false);
circuit = updateCircuitAfterFailure(circuit, 2_000, 2, 60_000);
assert.equal(circuitOpen(circuit, 2_001), true);

process.env.EA_FLAG_FACTORY_DURABLE_RETRIES = 'garbage';
assert.equal(featureEnabled('factory_durable_retries'), false, 'invalid flag values must fail closed');
delete process.env.EA_FLAG_FACTORY_DURABLE_RETRIES;

assert.doesNotThrow(() => assertNoPublicSecrets({ SAFE_SECRET: 'x' }));
assert.throws(() => assertNoPublicSecrets({ NEXT_PUBLIC_API_KEY: 'x' }));

markProviderFailure('openai', new Error('429 rate limit'), 60_000);
assert.equal(getProviderRuntimeHealth('openai').status, 'RATE_LIMIT');
assert.equal(providerUsable('openai', Date.now()), false);
markProviderSuccess('openai');
assert.equal(providerUsable('openai'), true);
assert.equal(getProviderRuntimeHealth('openai').status, 'HEALTHY');

console.log('Run 4 reliability contracts passed.');
