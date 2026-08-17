import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [audience, airtable, config, form, learning, progress, certificate, artwork] = await Promise.all([
  read('lib/amanda-catherine/audience.ts'),
  read('lib/airtable.ts'),
  read('lib/amanda-catherine/config.ts'),
  read('app/portal/[slug]/intake/IntakeFormClient.tsx'),
  read('app/portal/[slug]/learning/AmandaLearningCenter.tsx'),
  read('lib/amanda-catherine/progress-store.ts'),
  read('app/api/portal/amanda/certificate/route.ts'),
  read('public/amanda-catherine/aesthetikine-certificate-premium.svg'),
]);

for (const email of ['amanda@aesthetikine.com', 'amandacatherinec@gmail.com']) {
  assert.match(audience, new RegExp(email.replace('.', '\\.')));
  assert.match(airtable, new RegExp(email.replace('.', '\\.')));
}

for (const formId of [
  'client-intake-consent',
  'training-application',
  'practitioner-directory-application',
  'membership-application',
  'lifeline-media-guest',
  'volunteer-application',
  'partner-vendor-application',
]) assert.match(config, new RegExp(`id: '${formId}'`));

assert.match(form, /AMANDA_PORTAL_FORMS\.filter/);
assert.match(form, /selectedForm\?\.fields\.map/);
assert.match(form, /selectedForm\?\.uploads\.map/);
assert.match(form, /required/);
assert.match(learning, /% complete/);
assert.match(learning, /Download certificate/);
assert.match(progress, /certificateEligible/);
assert.match(progress, /certificateIssuedAt/);
assert.match(certificate, /certificateEligible\(progress\)/);
assert.match(certificate, /aesthetikine-certificate-premium\.svg/);
assert.match(artwork, /AESTHETIKINE ACADEMY/);
assert.match(artwork, /Certificate of Completion/);
assert.match(artwork, /RESTORE · LEARN · CREATE/);

console.log('Amanda completion contract: PASS');
