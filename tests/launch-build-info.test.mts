import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../app/api/ops/build-info/route';

test('build identity route reports the exact non-secret runtime identity without caching', async () => {
  const original = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    environment: process.env.VERCEL_ENV,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    fingerprint: process.env.EA_CRITICAL_CONFIG_FINGERPRINT,
  };
  Object.assign(process.env, {
    VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40),
    VERCEL_GIT_COMMIT_REF: 'work/certification',
    VERCEL_ENV: 'preview',
    VERCEL_DEPLOYMENT_ID: 'dpl_test',
    EA_CRITICAL_CONFIG_FINGERPRINT: 'B'.repeat(64),
  });
  try {
    const response = await GET();
    assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
    assert.deepEqual(await response.json(), {
      commitSha: 'a'.repeat(40), branch: 'work/certification', environment: 'preview',
      deploymentId: 'dpl_test', criticalConfigurationFingerprint: 'b'.repeat(64),
    });
  } finally {
    for (const [key, value] of Object.entries({
      VERCEL_GIT_COMMIT_SHA: original.commit,
      VERCEL_GIT_COMMIT_REF: original.branch,
      VERCEL_ENV: original.environment,
      VERCEL_DEPLOYMENT_ID: original.deploymentId,
      EA_CRITICAL_CONFIG_FINGERPRINT: original.fingerprint,
    })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('build identity route rejects a non-fingerprint value instead of reflecting it', async () => {
  const original = process.env.EA_CRITICAL_CONFIG_FINGERPRINT;
  process.env.EA_CRITICAL_CONFIG_FINGERPRINT = 'do-not-return-this-value';
  try {
    const response = await GET();
    const body = await response.json();
    assert.equal(body.criticalConfigurationFingerprint, null);
    assert.equal(JSON.stringify(body).includes('do-not-return-this-value'), false);
  } finally {
    if (original === undefined) delete process.env.EA_CRITICAL_CONFIG_FINGERPRINT;
    else process.env.EA_CRITICAL_CONFIG_FINGERPRINT = original;
  }
});

test('build identity route never fabricates a deployment ID from a commit', async () => {
  const original = {
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    commit: process.env.VERCEL_GIT_COMMIT_SHA,
    environment: process.env.VERCEL_ENV,
  };
  delete process.env.VERCEL_DEPLOYMENT_ID;
  process.env.VERCEL_GIT_COMMIT_SHA = 'a'.repeat(40);
  process.env.VERCEL_ENV = 'preview';
  try {
    const response = await GET();
    const body = await response.json();
    assert.equal(body.commitSha, 'a'.repeat(40));
    assert.equal(body.deploymentId, null);
  } finally {
    for (const [key, value] of Object.entries({
      VERCEL_DEPLOYMENT_ID: original.deploymentId,
      VERCEL_GIT_COMMIT_SHA: original.commit,
      VERCEL_ENV: original.environment,
    })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
