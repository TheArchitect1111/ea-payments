import { NextRequest, NextResponse } from 'next/server';
import {
  EACP_CHATGPT_ACTION_KEY_ENV,
  readBearerToken,
  verifyEACPChatGPTActionKey,
} from '@/lib/eacp-chatgpt-auth';
import { ensureEACPStoreTable } from '@/lib/eacp-store-setup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const bearer = readBearerToken(request.headers.get('authorization'));
  if (!verifyEACPChatGPTActionKey(bearer)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Missing or invalid bearer token. Set ${EACP_CHATGPT_ACTION_KEY_ENV} before setup.`,
      },
      { status: 401 },
    );
  }

  try {
    const result = await ensureEACPStoreTable();
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'EACP store setup failed.',
      },
      { status: 500 },
    );
  }
}
