import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { parseVoiceQuery, enhanceVoiceResponse } from '@/lib/ea-voice';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as { query?: string; enhance?: boolean };
  const query = body.query?.trim();
  if (!query) {
    return Response.json({ ok: false, error: 'Query is required.' }, { status: 400 });
  }

  let intent = parseVoiceQuery(query);
  if (body.enhance !== false) {
    intent = await enhanceVoiceResponse(intent, query);
  }

  return Response.json({ ok: true, intent });
}
