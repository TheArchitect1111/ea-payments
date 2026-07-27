import { NextRequest, NextResponse } from 'next/server';

import { requireAdminSessionFromRequest } from '@/lib/admin-session-guard';
import {
  isPeoplePostgresConfigured,
  peopleDbConfig,
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

function classifyFailure(detail: string): string {
  const value = detail.toLowerCase();
  if (value.includes('expired') || value.includes('exp claim')) return 'expired';
  if (value.includes('signature') || value.includes('invalid jwt') || value.includes('token is invalid')) {
    return 'invalid_signature';
  }
  if (value.includes('claim') || value.includes('subject') || value.includes('audience')) {
    return 'invalid_claims';
  }
  if (value.includes('role')) return 'role_rejected';
  if (value.includes('permission') || value.includes('privilege')) return 'permission_denied';
  return 'authorization_rejected';
}

/**
 * Read-only production People probe.
 *
 * Public callers receive only readiness plus a non-sensitive blocker ID/status.
 * Authenticated EA administrators receive the individual checks. The probe
 * never creates or changes records.
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
    const cfg = peopleDbConfig()!;
    let gatewayStatus: number | undefined;
    let gatewayOk = false;
    try {
      const gateway = await fetch(`${cfg.url}/auth/v1/settings`, {
        headers: { apikey: cfg.apiKey },
        cache: 'no-store',
      });
      gatewayStatus = gateway.status;
      gatewayOk = gateway.ok;
    } catch {
      gatewayStatus = undefined;
    }
    checks.push({
      id: 'gateway_api_key',
      ok: gatewayOk,
      status: gatewayStatus,
      detail: gatewayOk ? 'Supabase gateway API key accepted' : 'Supabase gateway API key rejected',
    });

    if (gatewayOk) {
      const schema = await peopleRest('');
      checks.push({
        id: 'people_app_jwt',
        ok: schema.ok,
        status: schema.ok ? 200 : schema.status,
        detail: schema.ok ? 'People Data API bearer accepted' : schema.error,
      });

      if (schema.ok) {
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
    }
  }

  const required = ['configuration', 'gateway_api_key', 'people_app_jwt', 'people_app_rpc'];
  const ok = required.every((id) => checks.some((check) => check.id === id && check.ok));
  const failed = checks.find((check) => !check.ok);
  const summary = {
    ok,
    status: ok ? 'ready' : 'blocked',
    blocker: failed?.id ?? null,
    blockerStatus: failed?.status ?? null,
    blockerReason: failed ? classifyFailure(failed.detail) : null,
  };
  const auth = await requireAdminSessionFromRequest(req);

  return NextResponse.json(auth.ok ? { ...summary, mode: 'read_only', checks } : summary, {
    status: ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
