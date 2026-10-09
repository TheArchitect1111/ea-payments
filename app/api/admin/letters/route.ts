import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { listAmandaConfirmationLetters, saveAmandaConfirmationLetter } from '@/lib/amanda-catherine/confirmation-letters';

export const dynamic = 'force-dynamic';
const LetterSchema = z.object({
  type: z.enum(['live', 'waitlist']),
  subject: z.string().trim().min(1).max(200),
  body_html: z.string().min(1).max(10000),
});

async function authorized(request: NextRequest) {
  const auth = await guardPortalApi(request, { slug: 'amanda-catherine' });
  if (!auth.ok) return { response: portalApiUnauthorized(auth) };
  if (!roleAtLeast(normalizeRole(auth.session.role), 'admin')) {
    return { response: NextResponse.json({ ok: false, error: 'Amanda admin access required.' }, { status: 403 }) };
  }
  return { response: null as Response | null };
}

export async function GET(request: NextRequest) {
  const access = await authorized(request);
  if (access.response) return access.response;
  return NextResponse.json({ ok: true, letters: await listAmandaConfirmationLetters() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: NextRequest) {
  const access = await authorized(request);
  if (access.response) return access.response;
  const parsed = LetterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Letter details are invalid.' }, { status: 400 });
  const saved = await saveAmandaConfirmationLetter({ ...parsed.data, editable: true });
  return NextResponse.json({ ok: true, letter: saved }, { headers: { 'Cache-Control': 'no-store' } });
}
