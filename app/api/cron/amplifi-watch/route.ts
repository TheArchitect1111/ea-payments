import { NextRequest, NextResponse } from 'next/server';
import { runDueTopicWatches } from '@/lib/amplifi/topic-watch';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function configuredOrgs(): string[] {
  return String(process.env.AMPLIFI_WATCH_ORG_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const orgs = configuredOrgs();
  if (!orgs.length) {
    return NextResponse.json({ ok: true, checked: 0, updated: 0, discoveries: 0, note: 'AMPLIFI_WATCH_ORG_IDS not configured' });
  }

  let checked = 0;
  let updated = 0;
  let discoveries = 0;
  for (const orgId of orgs) {
    const result = await runDueTopicWatches(orgId);
    checked += result.checked;
    updated += result.updated;
    discoveries += result.discoveries;
  }

  return NextResponse.json({ ok: true, checked, updated, discoveries, at: new Date().toISOString() });
}
