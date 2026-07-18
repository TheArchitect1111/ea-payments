import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import {
  EACP_CHATGPT_ACTION_KEY_ENV,
  readBearerToken,
  verifyEACPChatGPTActionKey,
} from '@/lib/eacp-chatgpt-auth';
import { runFieldDemo, type FieldDemoInput } from '@/lib/field-demo-orchestrator';
import { EACPPersistenceConfigurationError, EACPStoreConflictError } from '@/lib/eacp-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

function unauthorized(message = 'Unauthorized EACP ChatGPT action request.') {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const bearer = readBearerToken(request.headers.get('authorization'));
  if (!verifyEACPChatGPTActionKey(bearer)) {
    return unauthorized(
      `Missing or invalid bearer token. Set ${EACP_CHATGPT_ACTION_KEY_ENV} in Vercel and in the ChatGPT Action.`,
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(`field-demo:${ip}`, 8, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Field demo rate limit exceeded. Try again later.' },
      { status: 429 },
    );
  }

  let body: FieldDemoInput;
  try {
    body = (await request.json()) as FieldDemoInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const result = await runFieldDemo(body);
    if (!result.ok && !result.pack) {
      return NextResponse.json(
        {
          ok: false,
          error: result.message,
          missing: result.errors,
        },
        { status: 400 },
      );
    }

    const pack = result.pack;
    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      slug: result.slug,
      siteUrl: pack?.siteUrl,
      reportUrl: pack?.reportUrl,
      portalUrl: pack?.portalUrl,
      portalLoginUrl: pack?.portalLoginUrl,
      launchId: pack?.launchId,
      launchReviewUrl: pack?.launchReviewUrl,
      talkingPoints: pack?.talkingPoints,
      errors: result.errors,
      checkEmail: 'Field demo pack emailed to ADMIN_NOTIFICATION_EMAIL.',
    });
  } catch (error) {
    if (error instanceof EACPStoreConflictError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    if (error instanceof EACPPersistenceConfigurationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
    }
    throw error;
  }
}
