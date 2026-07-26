/**
 * Repository selection (Phase 2C).
 *
 * | Environment                             | Adapter                             |
 * |-----------------------------------------|-------------------------------------|
 * | `PEOPLE_CERT_MEMORY=1` (tests/cert)     | memory                              |
 * | Persist ON + Postgres configured        | Postgres (`people` schema)          |
 * | Persist ON without credentials          | throws `unavailable` (INV-19)       |
 * | People ON, Persist OFF, local/dev       | memory                              |
 * | People ON, Persist OFF, prod/preview    | throws `illegal_flag` (INV-20)      |
 * | People OFF                              | memory (tests only)                 |
 *
 * Airtable People SoR is quarantined — never selected here (INV-33).
 * There is never a silent memory fallback once persistence is enabled.
 */
import {
  assertPeoplePersistReady,
  isPeopleCertMemoryForced,
  isPeopleProductionMode,
  isUniversalPeopleEnabled,
  isUniversalPeoplePersistEnabled,
} from '@/lib/people/flags';
import { peopleIllegalFlag } from '@/lib/people/errors';
import { memoryPeopleRepository } from '@/lib/people/memory-repository';
import { incPeopleMetric } from '@/lib/people/metrics';
import { postgresPeopleRepository } from '@/lib/people/postgres-repository';
import type { PeopleRepository } from '@/lib/people/repository';

export function getPeopleRepository(): PeopleRepository {
  if (isPeopleCertMemoryForced() && !isPeopleProductionMode()) {
    return memoryPeopleRepository();
  }

  if (isUniversalPeoplePersistEnabled()) {
    // Throws `unavailable` when credentials are missing — never degrades to memory.
    assertPeoplePersistReady();
    return postgresPeopleRepository();
  }

  if (isUniversalPeopleEnabled() && isPeopleProductionMode()) {
    incPeopleMetric('people_illegal_flag_denied', 'adapter');
    throw peopleIllegalFlag(
      'UNIVERSAL_PEOPLE requires UNIVERSAL_PEOPLE_PERSIST in production/preview',
    );
  }

  return memoryPeopleRepository();
}

/** True when the active repository is the durable Postgres system of record. */
export function isPeoplePersistenceActive(): boolean {
  if (isPeopleCertMemoryForced() && !isPeopleProductionMode()) return false;
  return isUniversalPeoplePersistEnabled();
}
