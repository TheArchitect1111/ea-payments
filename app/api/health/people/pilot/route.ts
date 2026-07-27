import { createHash, randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { peopleRest, peopleRpc } from '@/lib/people/postgres-client';

export const dynamic = 'force-dynamic';

const ONE_TIME_KEY_HASH = 'bfa3cab5baa466f4171ae3b05d80ace7b9d9776eaacb7ec31c7415123357b0ac';

function authorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key') ?? '';
  return createHash('sha256').update(key).digest('hex') === ONE_TIME_KEY_HASH;
}

type EnsureResult = {
  created: boolean;
  person_key: string;
  person: { updated_at: string; display_name: string };
};

type PilotCheck = { id: string; ok: boolean; detail: string };

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const runId = randomUUID();
  const organizationId = `ea-people-pilot-${runId}`;
  const personA = `pilot-person-a-${runId}`;
  const personB = `pilot-person-b-${runId}`;
  const emailA = `pilot-a-${runId}@invalid.example`;
  const emailB = `pilot-b-${runId}@invalid.example`;
  const checks: PilotCheck[] = [];

  const check = (id: string, ok: boolean, detail: string) => checks.push({ id, ok, detail });

  try {
    const first = await peopleRpc<EnsureResult>('ensure_person', {
      p_organization_id: organizationId,
      p_person_key: personA,
      p_display_name: 'EA People Pilot A',
      p_email: emailA,
      p_portal_slug: 'ea-people-pilot',
      p_client_record_id: null,
      p_source: 'controlled-pilot',
    });
    check('create_person_a', first.ok && first.data.created === true, first.ok ? 'created' : first.error);
    if (!first.ok) throw new Error('create_person_a failed');

    const second = await peopleRpc<EnsureResult>('ensure_person', {
      p_organization_id: organizationId,
      p_person_key: personB,
      p_display_name: 'EA People Pilot B',
      p_email: emailB,
      p_portal_slug: 'ea-people-pilot',
      p_client_record_id: null,
      p_source: 'controlled-pilot',
    });
    check('create_person_b', second.ok && second.data.created === true, second.ok ? 'created' : second.error);
    if (!second.ok) throw new Error('create_person_b failed');

    const idempotent = await peopleRpc<EnsureResult>('ensure_person', {
      p_organization_id: organizationId,
      p_person_key: `duplicate-attempt-${runId}`,
      p_display_name: 'EA People Pilot A Duplicate',
      p_email: emailA,
      p_portal_slug: 'ea-people-pilot',
      p_client_record_id: null,
      p_source: 'controlled-pilot',
    });
    check(
      'identity_idempotency',
      idempotent.ok && idempotent.data.created === false && idempotent.data.person_key === personA,
      idempotent.ok ? 'existing identity returned' : idempotent.error,
    );

    const read = await peopleRpc<{ person_key: string } | null>('get_person', {
      p_person_key: personA,
    });
    check('read_person', read.ok && read.data?.person_key === personA, read.ok ? 'readback matched' : read.error);

    const updated = await peopleRpc<{ display_name: string }>('update_person', {
      p_organization_id: organizationId,
      p_person_key: personA,
      p_expected_updated_at: first.data.person.updated_at,
      p_patch: { display_name: 'EA People Pilot A Updated' },
    });
    check(
      'update_person',
      updated.ok && updated.data.display_name === 'EA People Pilot A Updated',
      updated.ok ? 'update matched' : updated.error,
    );

    const relationship = await peopleRpc<{ edge_key: string }>('upsert_relationship', {
      p_organization_id: organizationId,
      p_edge_key: `pilot-edge-${runId}`,
      p_from_person_key: personA,
      p_to_person_key: personB,
      p_type: 'controlled-pilot',
      p_status: 'active',
      p_expires_at: null,
      p_notes: 'Disposable launch-readiness pilot',
    });
    check(
      'relationship_upsert',
      relationship.ok && relationship.data.edge_key === `pilot-edge-${runId}`,
      relationship.ok ? 'relationship matched' : relationship.error,
    );

    const isolated = await peopleRest<Array<{ person_key: string }>>(
      `persons?select=person_key&organization_id=eq.${encodeURIComponent(organizationId)}`,
      { organizationId: `${organizationId}-other` },
    );
    check(
      'tenant_isolation',
      isolated.ok && Array.isArray(isolated.data) && isolated.data.length === 0,
      isolated.ok ? 'cross-tenant read returned zero rows' : isolated.error,
    );
  } catch (error) {
    check('pilot_execution', false, error instanceof Error ? error.message : 'pilot failed');
  } finally {
    const cleanupTargets = ['relationships', 'person_email_keys', 'person_external_keys', 'persons'];
    let cleanupOk = true;
    for (const table of cleanupTargets) {
      const result = await peopleRest(`${table}?organization_id=eq.${encodeURIComponent(organizationId)}`, {
        method: 'DELETE',
        prefer: 'return=minimal',
        organizationId,
      });
      cleanupOk = cleanupOk && result.ok;
    }
    check('cleanup', cleanupOk, cleanupOk ? 'all disposable rows removed' : 'cleanup failed');
  }

  const ok = checks.every((item) => item.ok);
  return NextResponse.json(
    { ok, mode: 'controlled_disposable_pilot', checks },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
