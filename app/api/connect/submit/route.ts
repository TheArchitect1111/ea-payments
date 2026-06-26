import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { triggerConnectAutomations } from '@/lib/connect-automations';
import { classifyConnection } from '@/lib/connect-classification';
import { resolveConnectDestination } from '@/lib/connect-destination';
import {
  createConnectionRecord,
  getConnectProfileBySlug,
  updateConnectionAutomationStatus,
} from '@/lib/connect-store';
import { validateConnectionBody } from '@/lib/connect-validation';

export const dynamic = 'force-dynamic';

function deviceFromUa(ua: string) {
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function browserFromUa(ua: string) {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  return 'Unknown';
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const slug = String(body.slug ?? '').trim().toLowerCase();
  if (!slug) return NextResponse.json({ ok: false, error: 'Profile slug is required.' }, { status: 400 });

  const profile = await getConnectProfileBySlug(slug);
  if (!profile || !profile.isActive) {
    return NextResponse.json({ ok: false, error: 'Connect profile not found.' }, { status: 404 });
  }

  const headerStore = await headers();
  const ua = headerStore.get('user-agent') || '';
  const validation = validateConnectionBody(
    {
      ...body,
      device: body.device || deviceFromUa(ua),
      browser: body.browser || browserFromUa(ua),
    },
    profile.id,
    profile.ownerUserId,
  );

  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const classification = await classifyConnection(validation.input, profile);
  const destinationUrl = resolveConnectDestination(profile, classification, validation.input);
  const created = await createConnectionRecord(validation.input, classification, destinationUrl);

  if (!created.ok || !created.connection) {
    return NextResponse.json({ ok: false, error: created.error || 'Could not save connection.' }, { status: 500 });
  }

  const automation = await triggerConnectAutomations(profile, created.connection);
  await updateConnectionAutomationStatus(created.connection.id, automation.status);

  return NextResponse.json({
    ok: true,
    connectionId: created.connection.id,
    destinationUrl,
    classification,
    automationStatus: automation.status,
  });
}
