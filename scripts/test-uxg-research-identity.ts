/**
 * Identity resolution unit tests — supplied domain wins; near-names rejected.
 * Run: npx --yes tsx scripts/test-uxg-research-identity.ts
 */
import assert from 'node:assert/strict';
import {
  domainAgreesWithSubject,
  resolveIdentityCandidates,
} from '../lib/uxg/research/identity-resolve';

async function main() {
  // Ascension Circle official domain agrees; academy near-name does not.
  assert.equal(domainAgreesWithSubject('ascensioncircle.org', 'Ascension Circle').ok, true);
  assert.equal(domainAgreesWithSubject('ascensionacademy.com', 'Ascension Circle').ok, false);

  const ascension = await resolveIdentityCandidates({
    subjectName: 'Ascension Circle',
    distinguishingDetail: 'nonprofit community',
    knownUrls: ['https://ascensioncircle.org'],
  });
  assert.deepEqual(ascension.lockedOfficialDomains, ['ascensioncircle.org']);
  assert.equal(ascension.identityVerified, true);
  assert.equal(ascension.identityStatus, 'resolved');
  assert.equal(ascension.officialDomains.includes('ascensionacademy.com'), false);

  // Simulate search pollution: ensure academy cannot become official.
  const polluted = await resolveIdentityCandidates({
    subjectName: 'Ascension Circle',
    knownUrls: ['https://ascensioncircle.org/'],
  });
  for (const d of polluted.officialDomains) {
    assert.notEqual(d, 'ascensionacademy.com');
  }

  const brickey = await resolveIdentityCandidates({
    subjectName: 'Brickey Botanicals',
    knownUrls: ['https://brickeybotanicals.com/'],
  });
  assert.deepEqual(brickey.lockedOfficialDomains, ['brickeybotanicals.com']);
  assert.equal(brickey.identityVerified, true);

  const kristina = await resolveIdentityCandidates({
    subjectName: 'Kristina Brickey',
    distinguishingDetail: 'patient care liaison 3HC home health North Carolina',
    knownUrls: ['https://www.3hc.org/'],
  });
  assert.deepEqual(kristina.lockedOfficialDomains, ['3hc.org']);
  assert.equal(kristina.employerAffiliation.active, true);
  assert.equal(kristina.employerAffiliation.employerDomain, '3hc.org');
  assert.equal(kristina.entityTypeHint, 'person');

  console.log(
    JSON.stringify(
      {
        ok: true,
        ascension: {
          locked: ascension.lockedOfficialDomains,
          rejectedSample: ascension.rejectedDomains.slice(0, 3),
        },
        brickey: { locked: brickey.lockedOfficialDomains },
        kristina: {
          locked: kristina.lockedOfficialDomains,
          employer: kristina.employerAffiliation,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
