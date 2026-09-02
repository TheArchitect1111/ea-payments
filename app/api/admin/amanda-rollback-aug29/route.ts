import { NextRequest, NextResponse } from 'next/server';

const PROJECT_ID = 'prj_x53IeeX3G9inkYUg87NJTHaXT9nw';
const DEPLOYMENT_ID = 'dpl_9oUDDWfrgBKdhEegDAbHwHHETzvh';
const TEAM_ID = 'team_s7mlAoJkDCQYaXiSC8nYDNIX';
const KEY = 'ac-aug29-7f3d9c';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== KEY) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Missing VERCEL_OIDC_TOKEN' }, { status: 500 });
  }

  const url = `https://api.vercel.com/v1/projects/${PROJECT_ID}/rollback/${DEPLOYMENT_ID}?teamId=${TEAM_ID}&description=${encodeURIComponent('Restore Amanda known-good August 29 2026 production')}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const text = await response.text();
  return NextResponse.json({ ok: response.ok, status: response.status, body: text }, { status: response.ok ? 200 : 502 });
}
