import fs from 'node:fs';
import assert from 'node:assert/strict';

const path = '.ea/athlete-brand-os/run0-athlete-os-contract-rights-registry.v1.json';
const c = JSON.parse(fs.readFileSync(path, 'utf8'));

assert.equal(c.program, 'EA_ATHLETE_BRAND_OPPORTUNITY_SYSTEM_V1');
assert.equal(c.run, 0);
assert.equal(c.responsibilityBoundaries.Amplifi.includes('discover'), true);
assert.equal(c.responsibilityBoundaries.Eva.includes('collect-decisions'), true);
assert.equal(c.rightsRegistry.defaultState, 'UNKNOWN');
assert.equal(c.rightsRegistry.unknownFailsClosed, true);
assert.equal(c.socialPolicy.autonomousPublicPublishing, false);
assert.equal(c.socialPolicy.athleteOrAuthorizedHumanApprovalRequired, true);
assert.equal(c.commercePolicy.athleteSeesCuratedOptionsNotRawProviderCatalog, true);
assert.equal(c.audiencePolicy.consentRequiredForMarketing, true);
assert.equal(c.audiencePolicy.crossAthleteAudienceLeakageForbidden, true);
assert.equal(c.opportunityPolicy.paidIsNotAlwaysHighestPriority, true);
assert.equal(c.dataIsolation.tenantScoped, true);
assert.equal(c.dataIsolation.athleteScoped, true);
assert.equal(c.tarrisProvingGround.clubWorkingName, 'TB3 Club');
assert.ok(c.approvalGates.includes('university-mark-use'));
assert.ok(c.acceptanceCriteria.length >= 10);

console.log('EA_ATHLETE_BRAND_OS_RUN0_CONTRACT_PASS');
