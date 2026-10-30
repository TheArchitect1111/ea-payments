import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public, non-secret identity data for exact-build launch verification. */
export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || null;
  const environment = process.env.VERCEL_ENV || process.env.EA_CERTIFICATION_ENVIRONMENT || 'unknown';
  const configurationFingerprint = process.env.EA_CRITICAL_CONFIG_FINGERPRINT || '';
  const criticalConfigurationFingerprint = /^[a-f0-9]{64}$/i.test(configurationFingerprint)
    ? configurationFingerprint.toLowerCase()
    : null;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;

  return NextResponse.json({
    commitSha,
    branch,
    environment,
    deploymentId,
    criticalConfigurationFingerprint,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
