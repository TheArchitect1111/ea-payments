import { peopleMajorityAge } from '@/lib/people/flags';
import type { Person } from '@/lib/people/types';

/** INV-6 — check-time minority. */
export function isPersonMinorAt(person: Person, now = new Date()): boolean {
  if (person.isMinor === true) {
    if (!person.dateOfBirth) return true;
    // Explicit isMinor with DOB: still recompute — adulthood wins when DOB proves majority
  }
  if (person.isMinor === false) return false;
  if (!person.dateOfBirth) return person.isMinor === true;

  const dob = new Date(person.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return person.isMinor === true;

  const majority = peopleMajorityAge();
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - majority, now.getUTCMonth(), now.getUTCDate()),
  );
  return dob.getTime() > cutoff.getTime();
}

export function isExpired(expiresAt: string | undefined | null, now = new Date()): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  return t <= now.getTime();
}
