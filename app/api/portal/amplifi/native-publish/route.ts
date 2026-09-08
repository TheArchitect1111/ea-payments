import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { publishThroughGateway } from '@/lib/amplifi-publishing-gateway';
import { guardAmplifiCapability } from '@/lib/amplifi-plan-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const access = await guardAmplifiCapability(auth.session, 'publishing');
  if (!access.allowed) return NextResponse.json({ ok:false, error:`${access.plan.name} does not include direct publishing. Upgrade to a paid Amplifi plan to connect and publish to social channels.`, code:'AMPLIFI_PLAN_REQUIRED', plan:access.planId }, { status:403 });
  const body = (await req.json().catch(() => ({}))) as { text?: string; mediaUrl?: string; platforms?: Array<'facebook'|'instagram'|'linkedin'|'tiktok'|'x'>; scheduleDate?: string };
  const text = body.text?.trim();
  if (!text) return NextResponse.json({ ok:false, error:'Post text is required.' }, { status:400 });
  const publishResults = await publishThroughGateway({ portalSlug:auth.session.slug, text, mediaUrl:body.mediaUrl?.trim(), platforms:body.platforms, scheduleDate:body.scheduleDate?.trim() });
  const results = publishResults.map((item)=>({ ok:item.ok, provider:item.provider, id:item.id, account:{ id:item.id || `${item.provider}:${item.platform || 'gateway'}`, platform:item.platform || item.provider, name:item.platform || item.provider }, error:item.error }));
  const ok = results.some((item)=>item.ok);
  return NextResponse.json({ ok, results, entitlement:{ plan:access.planId } }, { status:ok?200:409 });
}
