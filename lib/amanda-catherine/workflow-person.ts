import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import { resolvePeopleTenantFromSlug } from '@/lib/people/resolve-tenant';
import { ensurePersonForClientRecordAsync } from '@/lib/people/ensure-person';
import { getPeopleRepository } from '@/lib/people/adapter';

/** Attach Amanda workflow records through the canonical email identity upsert.
 * Never enable global People flags or invent an organization identity here. */
export async function linkAmandaWorkflowPerson(input: {
  email: string; name: string; clientRecordId?: string;
  reference: string; label: string; student?: boolean;
}) {
  if (!isUniversalPeopleEnabled()) return null;
  const tenant = await resolvePeopleTenantFromSlug('amanda-catherine');
  if (!tenant?.organization || tenant.organizationId.startsWith('org_')) {
    throw new Error('Amanda People requires a persisted organization.');
  }
  const repository = getPeopleRepository();
  const existing = await repository.findPersonByEmail(tenant.organizationId, input.email.trim().toLowerCase());
  const directory = existing ? await repository.getDirectoryMembership(tenant.organizationId, existing.id) : null;
  const role = input.student ? 'student' as const : 'participant' as const;
  const person = await ensurePersonForClientRecordAsync({
    organizationId: tenant.organizationId, portalSlug: 'amanda-catherine',
    email: input.email, displayName: input.name, clientRecordId: input.clientRecordId,
    roles: [...new Set([...(directory?.roles || []), role])], source: 'provisioning',
  });
  if (!person) throw new Error('Amanda person record could not be linked.');
  await getPeopleRepository().upsertProgramLink({
    organizationId: tenant.organizationId, personId: person.id,
    kind: 'other', externalRef: input.reference, label: input.label, status: 'active',
  });
  return person.id;
}
