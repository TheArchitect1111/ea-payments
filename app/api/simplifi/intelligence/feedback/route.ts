import { NextResponse } from 'next/server';
import { requirePortalSession } from '@/lib/auth/resolve-portal-session';
import {
  applyIntelligenceFeedback,
  type IntelligenceFeedbackAction,
} from '@/lib/simplifi-os';

export const dynamic = 'force-dynamic';

const ACTIONS = new Set<IntelligenceFeedbackAction>([
  'viewed',
  'opened',
  'completed',
  'deferred',
  'dismissed',
  'ignored',
  'helpful',
  'incorrect',
]);

/** POST /api/simplifi/intelligence/feedback */
export async function POST(request: Request) {
  const session = await requirePortalSession({ realm: 'simplifi' });
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  let body: { itemId?: string; action?: string; deferUntil?: string };
  try {
    body = (await request.json()) as { itemId?: string; action?: string; deferUntil?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
  const action = body.action as IntelligenceFeedbackAction;
  if (!itemId || !ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, error: 'itemId and a valid action are required.' },
      { status: 400 },
    );
  }

  const result = await applyIntelligenceFeedback({
    portalSlug: session.slug,
    itemId,
    action,
    actorId: session.email ?? session.slug,
    deferUntil: typeof body.deferUntil === 'string' ? body.deferUntil : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, itemId, action });
}
