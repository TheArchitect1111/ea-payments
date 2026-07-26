/**
 * Loads the request-scoped rows `assertPeopleAccess` needs from the active repository.
 *
 * INV-27 — the result must be used for a single access check within one request and
 * never cached across requests: guardian edges, consents, expiry, and majority are
 * always re-read so a revoked grant denies immediately (ADV-P-6).
 *
 * This module intentionally lives outside `acl.ts` so the ACL evaluator keeps zero
 * persistence imports (and no path to the OpenFGA projector — INV-16).
 */
import { getPeopleRepository } from '@/lib/people/adapter';
import type { PeopleAclContext } from '@/lib/people/acl';
import type { Person, PersonId } from '@/lib/people/types';

export async function loadPeopleAclContext(input: {
  organizationId: string;
  personId: PersonId;
  actorPersonId?: PersonId;
}): Promise<PeopleAclContext> {
  const repo = getPeopleRepository();
  const person = await repo.getPerson(input.personId);

  const [grants, consents, relationships, actorDirectoryMembership] = await Promise.all([
    repo.listAclGrantsForResource(input.organizationId, 'person', input.personId),
    repo.listConsents(input.personId),
    input.actorPersonId
      ? repo.listRelationshipsForOrg(input.organizationId)
      : Promise.resolve([]),
    input.actorPersonId
      ? repo.getDirectoryMembership(input.organizationId, input.actorPersonId)
      : Promise.resolve(null),
  ]);

  return { person, grants, consents, relationships, actorDirectoryMembership };
}

/**
 * Batch loader for list/export endpoints: relationships and the actor membership are
 * shared across the page, per-person rows are loaded per subject.
 */
export async function loadPeopleAclContextBatch(input: {
  organizationId: string;
  actorPersonId?: PersonId;
}): Promise<{
  relationships: PeopleAclContext['relationships'];
  actorDirectoryMembership: PeopleAclContext['actorDirectoryMembership'];
  forPerson: (person: Person) => Promise<PeopleAclContext>;
}> {
  const repo = getPeopleRepository();
  const [relationships, actorDirectoryMembership] = await Promise.all([
    input.actorPersonId ? repo.listRelationshipsForOrg(input.organizationId) : Promise.resolve([]),
    input.actorPersonId
      ? repo.getDirectoryMembership(input.organizationId, input.actorPersonId)
      : Promise.resolve(null),
  ]);

  return {
    relationships,
    actorDirectoryMembership,
    forPerson: async (person: Person) => {
      const [grants, consents] = await Promise.all([
        repo.listAclGrantsForResource(input.organizationId, 'person', person.id),
        repo.listConsents(person.id),
      ]);
      return { person, grants, consents, relationships, actorDirectoryMembership };
    },
  };
}
