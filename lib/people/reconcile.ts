/**
 * Referential-integrity reconciliation (blueprint §6.6).
 *
 * Airtable has no foreign keys, so orphan graph rows and duplicate identity keys are
 * detected by a periodic per-organization pass. This function never deletes a Person
 * and never auto-merges: it reports, audits, and raises metrics so ops can act (§20.1).
 */
import { getPeopleRepository } from '@/lib/people/adapter';
import { orgEmailKeysForPerson, personParticipatesInEmailUniqueness } from '@/lib/people/keys';
import { incPeopleMetric } from '@/lib/people/metrics';
import type { PeopleRepository } from '@/lib/people/repository';
import type { PersonId } from '@/lib/people/types';

export type PeopleReconcileFinding = {
  kind:
    | 'orphan_relationship'
    | 'orphan_household_member'
    | 'orphan_program_link'
    | 'orphan_acl_grant'
    | 'duplicate_org_email_key'
    | 'absorbed_without_tombstone'
    | 'guardian_edge_to_adult';
  severity: 'warn' | 'page';
  detail: string;
  personId?: PersonId;
  relatedId?: string;
};

export type PeopleReconcileReport = {
  organizationId: string;
  personCount: number;
  findings: PeopleReconcileFinding[];
  orphanCount: number;
  duplicateKeyCount: number;
  ok: boolean;
  at: string;
};

export async function reconcilePeopleOrganization(
  organizationId: string,
  repository?: PeopleRepository,
): Promise<PeopleReconcileReport> {
  const repo = repository || getPeopleRepository();
  const findings: PeopleReconcileFinding[] = [];

  const persons = await repo.listPersonsByOrg(organizationId);
  const byId = new Map(persons.map((p) => [p.id, p]));

  // 1. Relationships pointing at missing Person Keys.
  for (const edge of await repo.listRelationshipsForOrg(organizationId)) {
    for (const ref of [edge.fromPersonId, edge.toPersonId]) {
      if (!byId.has(ref)) {
        findings.push({
          kind: 'orphan_relationship',
          severity: 'warn',
          detail: `relationship ${edge.id} references missing person`,
          relatedId: edge.id,
        });
      }
    }
    // 3. Active guardian edges to adults: ACL denies at check time (INV-6); report only.
    if (edge.status === 'active' && edge.type === 'guardian_of') {
      const subject = byId.get(edge.toPersonId);
      if (subject && subject.isMinor === false) {
        findings.push({
          kind: 'guardian_edge_to_adult',
          severity: 'warn',
          detail: `guardian edge ${edge.id} targets a non-minor`,
          relatedId: edge.id,
          personId: subject.id,
        });
      }
    }
  }

  // 2. Absorbed persons whose tombstone pointer is missing after a completed job.
  for (const person of persons) {
    if (person.duplicateOfPersonId && !person.mergedIntoPersonId) {
      findings.push({
        kind: 'absorbed_without_tombstone',
        severity: 'page',
        detail: 'duplicate person is missing mergedIntoPersonId',
        personId: person.id,
      });
    }

    for (const member of await repo.listHouseholdMembersForPerson(person.id)) {
      if (!byId.has(member.personId)) {
        findings.push({
          kind: 'orphan_household_member',
          severity: 'warn',
          detail: `household member ${member.id} references missing person`,
          relatedId: member.id,
        });
      }
    }
    for (const link of await repo.listProgramLinks(person.id)) {
      if (!byId.has(link.personId)) {
        findings.push({
          kind: 'orphan_program_link',
          severity: 'warn',
          detail: `program link ${link.id} references missing person`,
          relatedId: link.id,
        });
      }
    }
    for (const grant of await repo.listAclGrantsForResource(
      organizationId,
      'person',
      person.id,
    )) {
      if (grant.grantee.kind === 'person' && !byId.has(grant.grantee.personId)) {
        findings.push({
          kind: 'orphan_acl_grant',
          severity: 'warn',
          detail: `acl grant ${grant.id} references missing grantee person`,
          relatedId: grant.id,
        });
      }
    }
  }

  // 4. Duplicate OrgEmailKey among non-merged persons → page immediately.
  const emailOwners = new Map<string, PersonId>();
  for (const person of persons) {
    if (!personParticipatesInEmailUniqueness(person)) continue;
    for (const key of orgEmailKeysForPerson(person)) {
      const owner = emailOwners.get(key);
      if (owner && owner !== person.id) {
        findings.push({
          kind: 'duplicate_org_email_key',
          severity: 'page',
          detail: 'duplicate OrgEmailKey among non-merged persons',
          personId: person.id,
          relatedId: owner,
        });
        incPeopleMetric('people_duplicate_email_key', 'reconcile');
        continue;
      }
      emailOwners.set(key, person.id);
    }
  }

  const orphanCount = findings.filter((f) => f.kind.startsWith('orphan_')).length;
  if (orphanCount > 0) incPeopleMetric('people_reconcile_orphan', 'reconcile', orphanCount);

  return {
    organizationId,
    personCount: persons.length,
    findings,
    orphanCount,
    duplicateKeyCount: findings.filter((f) => f.kind === 'duplicate_org_email_key').length,
    ok: findings.every((f) => f.severity !== 'page'),
    at: new Date().toISOString(),
  };
}
