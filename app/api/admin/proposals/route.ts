import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { adminAuthJsonError, requireAdminSession } from '@/lib/admin-session-guard';
import { getProposalsWithAssessments } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  const auth = requireAdminSession(token);
  if (!auth.ok) return adminAuthJsonError(auth);

  try {
    const proposals = await getProposalsWithAssessments();
    return NextResponse.json({ proposals });
  } catch (err) {
    console.error('GET /api/admin/proposals error:', err);
    return NextResponse.json({ error: 'Failed to fetch proposals.' }, { status: 500 });
  }
}
