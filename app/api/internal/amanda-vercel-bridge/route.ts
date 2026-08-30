import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TEAM_ID = 'team_s7mlAoJkDCQYaXiSC8nYDNIX';
const PROJECT_ID = 'prj_x53IeeX3G9inkYUg87NJTHaXT9nw';

export async function GET() {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, oidc: false, error: 'VERCEL_OIDC_TOKEN unavailable' }, { status: 503 });
  }

  const response = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  let body: unknown = null;
  try { body = await response.json(); } catch { body = null; }
  const project = body && typeof body === 'object' ? body as Record<string, unknown> : {};

  return NextResponse.json({
    ok: response.ok,
    oidc: true,
    status: response.status,
    projectId: project.id ?? null,
    projectName: project.name ?? null,
    error: response.ok ? null : (project.error ?? body ?? 'Vercel API request failed'),
  }, { status: response.ok ? 200 : 502 });
}
