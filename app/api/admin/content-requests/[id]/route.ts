import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { updateContentRequest } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { status?: string; markPublished?: boolean };
  const result = await updateContentRequest(id, {
    status: body.markPublished ? 'Published' : body.status,
    datePublished: body.markPublished ? new Date().toISOString().slice(0, 10) : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Update failed.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
