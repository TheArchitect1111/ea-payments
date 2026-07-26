import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import { ensurePersonForClientRecord } from '@/lib/people/ensure-person';
import {
  createProgramLink,
  findPersonByExternalId,
  listProgramLinks,
} from '@/lib/people/store';
import type { Person } from '@/lib/people/types';

export type ClientRecordMigrationInput = {
  organizationId: string;
  portalSlug?: string;
  clientRecordId: string;
  email: string;
  clientName: string;
  ctpWorkspaceRef?: string;
  ctpOpportunityRef?: string;
  dryRun?: boolean;
};

/**
 * Idempotent Client Record → Person attach. Never deletes Client Records (INV-11).
 */
export function migrateClientRecordToPerson(
  input: ClientRecordMigrationInput,
): { person: Person | null; created: boolean; dryRun: boolean } {
  if (!isUniversalPeopleEnabled()) {
    return { person: null, created: false, dryRun: Boolean(input.dryRun) };
  }

  if (input.dryRun) {
    const existing = findPersonByExternalId(
      input.organizationId,
      'client-record',
      input.clientRecordId,
    );
    return {
      person: existing,
      created: !existing,
      dryRun: true,
    };
  }

  const before = findPersonByExternalId(
    input.organizationId,
    'client-record',
    input.clientRecordId,
  );

  const person = ensurePersonForClientRecord({
    organizationId: input.organizationId,
    portalSlug: input.portalSlug,
    clientRecordId: input.clientRecordId,
    email: input.email,
    displayName: input.clientName,
    source: 'client-record-migration',
    ctpWorkspaceRef: input.ctpWorkspaceRef,
  });

  if (person && input.ctpOpportunityRef) {
    createProgramLink({
      organizationId: input.organizationId,
      personId: person.id,
      kind: 'ctp_opportunity',
      externalRef: input.ctpOpportunityRef,
      status: 'active',
    });
  }

  void listProgramLinks;

  return { person, created: !before && Boolean(person), dryRun: false };
}

export function migrateClientRecordToPersonIdempotent(
  input: ClientRecordMigrationInput,
): Person | null {
  const a = migrateClientRecordToPerson({ ...input, dryRun: false });
  const b = migrateClientRecordToPerson({ ...input, dryRun: false });
  if (a.person && b.person && a.person.id !== b.person.id) {
    throw new Error('Migration not idempotent');
  }
  return b.person;
}
