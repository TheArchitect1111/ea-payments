import { createBlueprintRecord, blueprintUrl, publicBlueprint, saveBlueprintRecord } from '@/lib/blueprint-store';
import { buildCtpV5Policy } from '@/lib/ctp-v5-policy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cors(origin: string | null) {
  const allowed = Boolean(
    !origin ||
    origin === 'https://cc.efficiencyarchitects.online' ||
    /^https:\/\/efficiency-architects-[a-z0-9-]+\.vercel\.app$/i.test(origin)
  );
  return {
    allowed,
    headers: {
      'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://cc.efficiencyarchitects.online',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch] || ch));
}

async function deliver(record: Awaited<ReturnType<typeof createBlueprintRecord>>) {
  const choice = record.contact.choice;
  const value = record.contact.value.trim();
  const url = blueprintUrl(record.clientId);
  if (choice === 'Email' && value) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !from) return { channel: 'email' as const, status: 'skipped' as const, detail: 'Email provider is not configured.' };
    const subject = String(record.summary.subject || 'Your free look at what is possible is ready');
    const text = String(record.summary.text || `Your Efficiency Architects blueprint is ready: ${url}`);
    const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;line-height:1.65;color:#17211c"><div style="white-space:pre-line">${escapeHtml(text)}</div><p style="margin-top:24px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;background:#596b5b;color:#fff;text-decoration:none;border-radius:8px">Open your blueprint</a></p></div>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [value], subject, html, text }),
    });
    return response.ok
      ? { channel: 'email' as const, status: 'sent' as const }
      : { channel: 'email' as const, status: 'failed' as const, detail: `Email provider returned ${response.status}.` };
  }

  if (choice === 'Text message' && value) {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_FROM_NUMBER?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();
    if (!sid || !token || !from) return { channel: 'sms' as const, status: 'skipped' as const, detail: 'SMS provider is not configured.' };
    const body = new URLSearchParams({ To: value, From: from, Body: `Your Efficiency Architects free look is ready. Open your blueprint: ${url}` });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    return response.ok
      ? { channel: 'sms' as const, status: 'sent' as const }
      : { channel: 'sms' as const, status: 'failed' as const, detail: `SMS provider returned ${response.status}.` };
  }

  if (choice === 'I would rather discuss it in conversation') {
    return { channel: 'conversation' as const, status: 'skipped' as const, detail: 'Conversation requested.' };
  }
  return { channel: 'none' as const, status: 'skipped' as const, detail: 'No delivery channel selected.' };
}

export async function OPTIONS(request: Request) {
  const c = cors(request.headers.get('origin'));
  return new Response(null, { status: c.allowed ? 204 : 403, headers: c.headers });
}

export async function POST(request: Request) {
  const c = cors(request.headers.get('origin'));
  if (!c.allowed) return Response.json({ ok: false, error: 'Origin not allowed.' }, { status: 403, headers: c.headers });
  try {
    const raw = await request.text();
    if (raw.length > 1_500_000) return Response.json({ ok: false, error: 'Submission is too large.' }, { status: 413, headers: c.headers });
    const body = JSON.parse(raw || '{}');
    const intake = body.intake && typeof body.intake === 'object'
      ? body.intake
      : body.policy?.answers && typeof body.policy.answers === 'object'
        ? body.policy.answers
        : null;
    if (!intake) {
      return Response.json({ ok: false, error: 'CTP V5 intake answers are required.' }, { status: 400, headers: c.headers });
    }
    intake.contactChoice = body.contactChoice ?? intake.contactChoice ?? '';
    intake.contactValue = body.contactValue ?? intake.contactValue ?? '';
    intake.portalAlias = body.portalAlias ?? intake.portalAlias ?? '';
    const policy = buildCtpV5Policy(intake);
    const record = await createBlueprintRecord({
      policy,
      summary: body.summary,
      contactChoice: intake.contactChoice,
      contactValue: intake.contactValue,
      alias: intake.portalAlias,
    });
    record.delivery = await deliver(record);
    await saveBlueprintRecord(record);
    return Response.json({
      ok: true,
      clientId: record.clientId,
      portalUrl: blueprintUrl(record.clientId),
      delivery: record.delivery,
      record: publicBlueprint(record),
    }, { headers: c.headers });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create blueprint.' }, { status: 500, headers: c.headers });
  }
}
