import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const REQUIRED_CHECKS = [
  'clientRecord',
  'canonicalIdentity',
  'sessionSigning',
  'sessionVerification',
  'canonicalSlug',
  'authenticatedOwnerRoute',
  'authenticatedPortalHome',
  'authenticatedMemberRoute',
  'premiumOwnerDashboard',
  'allMenuRoutes',
  'allCourseResourceRoutes',
  'entrepreneurialArtistPlaylistConfigured',
] as const;

type AmandaHealthPayload = {
  ok?: boolean;
  checks?: Record<string, boolean>;
  menuRoutes?: unknown;
  courseResourceRoutes?: unknown;
  materialInventory?: unknown;
};

async function runHealth(origin: string) {
  const response = await fetch(`${origin}/api/health/amanda-login`, { cache: 'no-store' });
  let body: AmandaHealthPayload | null = null;
  try {
    body = (await response.json()) as AmandaHealthPayload;
  } catch {
    body = null;
  }
  const checks = body?.checks ?? {};
  const passed = response.status === 200 && body?.ok === true && REQUIRED_CHECKS.every((key) => checks[key] === true);
  return { passed, status: response.status, body };
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const passes = [];
  for (let index = 1; index <= 3; index += 1) {
    const result = await runHealth(origin);
    passes.push({ pass: index, passed: result.passed, status: result.status, checks: result.body?.checks ?? null, menuRoutes: result.body?.menuRoutes ?? null, courseResourceRoutes: result.body?.courseResourceRoutes ?? null, materialInventory: result.body?.materialInventory ?? null });
    if (!result.passed) break;
  }
  const ok = passes.length === 3 && passes.every((pass) => pass.passed);
  return NextResponse.json({ ok, tripleChecked: ok, passes }, { status: ok ? 200 : 503 });
}
