import { NextRequest, NextResponse } from 'next/server';
import { requirePortalSessionFromRequest } from '@/lib/auth/resolve-portal-session';
import { deleteSimplifiAccount } from '@/lib/simplifi-account-deletion';

export const dynamic = 'force-dynamic';

/**
 * POST /api/simplifi/account/delete
 * Authenticated account deletion for Simplifi Orb (Google Play requirement).
 * Body: { confirm: "DELETE" }
 */
export async function POST(req: NextRequest) {
  const session = await requirePortalSessionFromRequest(req, { realm: 'simplifi' });
  if (!session?.email || !session.slug) {
    return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== 'DELETE') {
    return NextResponse.json(
      { ok: false, error: 'Confirmation required. Send confirm: "DELETE".' },
      { status: 400 },
    );
  }

  const result = await deleteSimplifiAccount({
    slug: session.slug,
    email: session.email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Could not delete account.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    message:
      result.mode === 'shared_demo_tokens_only'
        ? 'Device tokens cleared. Shared demo portals stay available for other testers.'
        : 'Account deleted. Portal access is revoked and personal contact data has been removed.',
  });
}
