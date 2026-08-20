import { createHash } from 'node:crypto';

const AMANDA_PORTAL_SLUG = 'amanda-catherine';

type InvitedAmandaLearner = {
  audience: 'student-trainee';
  courseIds: readonly string[];
};

// Store only one-way email fingerprints in source. Learner names and email addresses
// remain in the authentication and course-progress stores at runtime.
const INVITED_LEARNERS: Readonly<Record<string, InvitedAmandaLearner>> = {
  '710b3a22197fd2a06611fa5710a868459d09ce863c975b4a3be13a008040da62': {
    audience: 'student-trainee',
    courseIds: ['body-sculpt-practitioner-certification'],
  },
  '58f1f69c8e70d6a67418209e296e4e62186b2bfdc941333a835b248cd10866d8': {
    audience: 'student-trainee',
    courseIds: ['body-sculpt-practitioner-certification'],
  },
  '8d1064aa073e2019f6ec59f607a888b0e0fe4716a468d41781b04b1b15919297': {
    audience: 'student-trainee',
    courseIds: ['aesthetikine-reset-training'],
  },
};

function emailFingerprint(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function invitedAmandaLearner(email: string) {
  return INVITED_LEARNERS[emailFingerprint(email)] || null;
}

export function invitedAmandaPortalIdentity(email: string) {
  return invitedAmandaLearner(email)
    ? { ok: true as const, slug: AMANDA_PORTAL_SLUG, recordId: '' }
    : null;
}
