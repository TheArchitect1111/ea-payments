import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAction } from '@/lib/admin-session-guard';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import {
  EACP_CHATGPT_ACTION_KEY_ENV,
  readBearerToken,
  verifyEACPChatGPTActionKey,
} from '@/lib/eacp-chatgpt-auth';

export async function requireFactoryApiAccess(request: NextRequest): Promise<
  | { ok: true; via: 'bearer' | 'admin' }
  | { ok: false; response: NextResponse }
> {
  const bearer = readBearerToken(request.headers.get('authorization'));
  if (verifyEACPChatGPTActionKey(bearer)) {
    return { ok: true, via: 'bearer' };
  }

  // Match Launch page access: any signed-in admin session (admin:access), not only admin:manage.
  const cookieStore = await cookies();
  const admin = requireAdminAction(cookieStore.get(EA_ADMIN_COOKIE)?.value, 'admin:access');
  if (admin.ok) {
    return { ok: true, via: 'admin' };
  }

  if (bearer) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: `Missing or invalid bearer token. Set ${EACP_CHATGPT_ACTION_KEY_ENV}.`,
        },
        { status: 401 },
      ),
    };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: admin.error || 'Please log in again, then try Launch.' },
      { status: admin.status },
    ),
  };
}
