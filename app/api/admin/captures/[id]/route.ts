import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { updateCaptureStatus, type CaptureStatus } from '@/lib/capture-records';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { status?: CaptureStatus };
  if (!body.status) {
    return Response.json({ ok: false, error: 'Status is required.' }, { status: 400 });
  }

  const result = await updateCaptureStatus(id, body.status);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true });
}
