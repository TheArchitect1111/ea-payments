import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { updateEnhancementRequest } from '@/lib/airtable';
import { sendInternalNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { status?: string; notes?: string; finalFee?: string };
  const result = await updateEnhancementRequest(id, {
    status: body.status,
    notes: body.finalFee ? `Final fee: ${body.finalFee}\n${body.notes ?? ''}` : body.notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Update failed.' }, { status: 500 });
  }

  if (body.finalFee) {
    await sendInternalNotification({
      subject: 'Enhancement estimate prepared',
      title: 'Enhancement Estimate',
      body: `Estimate prepared for enhancement request ${id}: ${body.finalFee}`,
    });
  }

  return NextResponse.json({ ok: true });
}
