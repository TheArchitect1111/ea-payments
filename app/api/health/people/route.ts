import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import {
  isPeoplePostgresConfigured,
  peopleRest,
  peopleRpc,
} from '@/lib/people/postgres-client';

export const dynamic = 'force-dynamic';

type Check = {
  id: string;
  ok: boolean;
  status?: number;
  detail: string;
};

/**
 * Read-only production People probe.
 *
 * Public callers receive only `{ ok, status }`. Authenticated EA administrators
 * receive the individual checks. The probe never creates or changes records.
 */
export async function GET(req: NextRequest) {
  const checks: Check[] = [];

  const configured = isPeoplePostgresConfigured();
  checks.push({
    id: 'configuration',
    ok: configured,
    detail: configured ? 'required credentials present' : 'required credentials missing',
  });

  if (configured) {
    const schema = await peopleRest('');
    checks.push({
      id: 'people_schema',
      ok: schema.ok,
      status: schema.ok ? 200 : schema.status,
      detail: schema.ok ? 'People Data API reachable' : schema.error,
    });

    const rpc = await peopleRpc<unknown>('get_person', {
      p_person_id: '00000000-0000-0000-0000-000000000000',
    });
    checks.push({
      id: 'people_app_rpc',
      ok: rpc.ok,
      status: rpc.ok ? 200 : rpc.status,
      detail: rpc.ok ? 'people_app read RPC reachable' : rpc.error,
    });
  }

  const ok = checks.length === 3 && checks.every((check) => check.ok);
  const summary = { ok, status: ok ? 'ready' : 'blocked' };
  const auth = await requireAdminSessionFromRequest(req);

  return NextResponse.json(auth.ok ? { ...summary, mode: 'read_only', checks } : summary, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
