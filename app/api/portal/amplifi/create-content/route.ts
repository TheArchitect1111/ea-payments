import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { callClaudeText } from '@/lib/ai';
import { buildAmplifiCreativePlan, type AmplifiCreationMode } from '@/lib/amplifi-creative-foundry';
import { guardAmplifiCapability } from '@/lib/amplifi-plan-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type GeneratedItem = { headline: string; caption: string; callToAction?: string; visualDirection?: string };

function cleanJson(text: string) { return text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim(); }
function fallbackItems(mode: AmplifiCreationMode, topic: string, objective: string, cta: string, count: number): GeneratedItem[] { return Array.from({ length: count }, (_, index) => ({ headline: mode === 'series' ? `${topic} · ${index + 1}` : topic, caption: mode === 'series' ? `A focused installment in the ${topic} series, written to support ${objective}.` : `${topic}. This post is designed to support ${objective}.`, callToAction: cta || undefined, visualDirection: mode === 'series' ? 'Premium recurring editorial system with consistent typography and varied composition.' : 'Emotionally relevant premium editorial social creative.' })); }

export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const body = (await req.json().catch(() => ({}))) as { mode?: AmplifiCreationMode; brandName?: string; websiteUrl?: string; primaryColor?: string; accentColor?: string; topic?: string; objective?: string; audience?: string; offer?: string; callToAction?: string; destinationUrl?: string; details?: string; imageStyle?: string; count?: number };
  const mode: AmplifiCreationMode = body.mode === 'series' ? 'series' : 'post';
  const access = await guardAmplifiCapability(auth.session, mode);
  if (!access.allowed) return NextResponse.json({ ok: false, error: `${access.plan.name} does not include ${mode} creation. Upgrade your Amplifi plan to use this feature.`, code: 'AMPLIFI_PLAN_REQUIRED', plan: access.planId }, { status: 403 });
  const topic = String(body.topic || '').trim(); const objective = String(body.objective || '').trim(); const audience = String(body.audience || '').trim(); const cta = String(body.callToAction || '').trim();
  const count = mode === 'series' ? Math.min(30, Math.max(3, Number(body.count) || 7)) : 1;
  if (!topic || !objective || !audience) return NextResponse.json({ ok: false, error: 'Topic, objective and audience are required.' }, { status: 400 });
  const prompt = [`Create ${count} ${mode === 'series' ? 'coordinated installments in a recurring social series' : 'premium social post'}.`,'Act as a senior creative director and conversion copywriter. Avoid generic AI language, filler, clichés, emoji clutter and unsupported claims.',mode === 'series' ? 'The installments must feel related but not repetitive. Give the series a recognizable rhythm and visual language.' : 'Make one clear idea do the work. Keep the hook concise and the caption useful.',`Topic: ${topic}`,`Objective: ${objective}`,`Audience: ${audience}`,body.offer ? `Offer: ${String(body.offer).trim()}` : '',cta ? `Call to action: ${cta}` : '',body.details ? `Context: ${String(body.details).trim()}` : '',`Return only JSON: {"items":[{"headline":"...","caption":"...","callToAction":"...","visualDirection":"..."}]}. Return exactly ${count} item${count === 1 ? '' : 's'}.`].filter(Boolean).join('\n');
  let items = fallbackItems(mode, topic, objective, cta, count);
  const generated = await callClaudeText(prompt, { maxTokens: Math.min(5000, 800 + (count * 220)) });
  if (generated) { try { const parsed = JSON.parse(cleanJson(generated)) as { items?: GeneratedItem[] }; if (Array.isArray(parsed.items) && parsed.items.length === count) items = parsed.items.map((item,index)=>({ headline:String(item.headline || `${topic} ${index+1}`).trim().slice(0,90), caption:String(item.caption||'').trim().slice(0,600), callToAction:String(item.callToAction||cta).trim().slice(0,120)||undefined, visualDirection:String(item.visualDirection||'').trim().slice(0,260)||undefined })); } catch {} }
  const creative = buildAmplifiCreativePlan({ mode, brand:{ brandId:`amplifi-${auth.session.slug}`, name:String(body.brandName||'Amplifi customer').trim(), websiteUrl:String(body.websiteUrl||'').trim()||undefined, primaryColor:String(body.primaryColor||'').trim()||undefined, accentColor:String(body.accentColor||'').trim()||undefined, preferredImageStyle:String(body.imageStyle||'').trim()||undefined }, objective, audience, offer:String(body.offer||'').trim()||undefined, message:topic, callToAction:cta||undefined, destinationUrl:String(body.destinationUrl||'').trim()||undefined, visualDirection:String(body.imageStyle||'').trim()||undefined, imageStyle:String(body.imageStyle||'').trim()||undefined, seriesCount:count }, items);
  return NextResponse.json({ ok:true, mode, creative, qaThreshold:8.5, regenerateOnFailure:true, entitlement:{ plan:access.planId } });
}
