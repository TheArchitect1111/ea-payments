import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { decryptAccounts, providerConfigs, providerCookie, publishNative } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as { text?: string; mediaUrl?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ ok: false, error: 'Post text is required.' }, { status: 400 });
  const accounts = providerConfigs().flatMap((config) => decryptAccounts(req.cookies.get(providerCookie(config.provider))?.value));
  if (!accounts.length) return NextResponse.json({ ok: false, error: 'Connect at least one social account first.' }, { status: 409 });
  const results = await Promise.all(accounts.map(async (account) => ({ account: { id: account.id, platform: account.platform, name: account.name }, ...(await publishNative(account, text, body.mediaUrl?.trim())) })));
  return NextResponse.json({ ok: results.some((item) => item.ok), results }, { status: results.some((item) => item.ok) ? 200 : 502 });
}
