import { NextRequest, NextResponse } from 'next/server';
import { loadAmplifiConnections } from '@/lib/amplifi-connection-store';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import {
  listTopicWatches,
  runTopicWatch,
  saveTopicWatchResult,
  updateTopicWatch,
  upsertTopicWatch,
  type WatchCadence,
} from '@/lib/amplifi/topic-watch';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CADENCES = new Set<WatchCadence>(['twice-weekly', 'weekly']);

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const watches = await listTopicWatches(tenant.organizationId);
  return NextResponse.json({ ok: true, watches });
}

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const connections = await loadAmplifiConnections(auth.session.slug);
  if (connections.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Connect at least one social account before scheduling research.' },
      { status: 409 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: 'create' | 'pause' | 'resume' | 'stop' | 'run';
    watchId?: string;
    topic?: string;
    cadence?: WatchCadence;
    timezone?: string;
    endAt?: string;
    postsPerRun?: number;
    objective?: string;
    audience?: string;
    tone?: string;
    callToAction?: string;
    ctaUrl?: string;
  };

  const action = body.action ?? 'create';

  if (action === 'create') {
    const topic = String(body.topic ?? '').trim();
    if (topic.length < 8) {
      return NextResponse.json({ ok: false, error: 'Topic must be at least 8 characters.' }, { status: 400 });
    }
    const cadence = body.cadence && CADENCES.has(body.cadence) ? body.cadence : 'weekly';
    const timezone = String(body.timezone ?? 'America/New_York').trim() || 'America/New_York';
    const endAt = String(body.endAt || '').trim();
    const endDate = new Date(endAt);
    const now = new Date();
    const maximumEnd = new Date(now);
    maximumEnd.setUTCMonth(maximumEnd.getUTCMonth() + 3);
    if (!endAt || Number.isNaN(endDate.getTime()) || endDate <= now || endAt.slice(0, 10) > maximumEnd.toISOString().slice(0, 10)) {
      return NextResponse.json({ ok: false, error: 'Choose a monitoring end date within the next three months.' }, { status: 400 });
    }
    const postsPerRun = Math.min(3, Math.max(1, Math.trunc(Number(body.postsPerRun) || 1))) as 1 | 2 | 3;
    const watch = await upsertTopicWatch({
      organizationId: tenant.organizationId,
      topic,
      cadence,
      timezone,
      endAt: endDate.toISOString(),
      postsPerRun,
      objective: String(body.objective || '').trim(),
      audience: String(body.audience || '').trim(),
      tone: String(body.tone || '').trim(),
      callToAction: String(body.callToAction || '').trim(),
      ctaUrl: String(body.ctaUrl || '').trim(),
    });
    return NextResponse.json({ ok: true, watch });
  }

  const watchId = String(body.watchId ?? '').trim();
  if (!watchId) return NextResponse.json({ ok: false, error: 'watchId is required.' }, { status: 400 });

  if (action === 'pause' || action === 'resume' || action === 'stop') {
    const status = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'stopped';
    const watch = await updateTopicWatch(tenant.organizationId, watchId, { status });
    if (!watch) return NextResponse.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, watch });
  }

  if (action === 'run') {
    const watch = (await listTopicWatches(tenant.organizationId)).find((row) => row.id === watchId);
    if (!watch) return NextResponse.json({ ok: false, error: 'Watch not found.' }, { status: 404 });
    const result = await runTopicWatch(watch);
    await saveTopicWatchResult(tenant.organizationId, result.watch);
    return NextResponse.json({ ok: true, watch: result.watch, research: result.research, newSources: result.newSourceCount });
  }

  return NextResponse.json({ ok: false, error: 'Unsupported action.' }, { status: 400 });
}
