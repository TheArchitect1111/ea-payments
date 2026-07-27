import { NextResponse } from 'next/server';
import {
  isPeoplePostgresConfigured,
  peopleRest,
} from '@/lib/people/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isPeoplePostgresConfigured();
  if (!configured) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  const result = await peopleRest<unknown[]>(
    'persons?select=person_key&limit=1',
    { organizationId: 'ea' },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, configured: true, status: result.status ?? null },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, configured: true });
}
