import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { getProposalsWithAssessments } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const proposals = await getProposalsWithAssessments();
    return NextResponse.json({ proposals });
  } catch (err) {
    console.error('GET /api/admin/proposals error:', err);
    return NextResponse.json({ error: 'Failed to fetch proposals.' }, { status: 500 });
  }
}
