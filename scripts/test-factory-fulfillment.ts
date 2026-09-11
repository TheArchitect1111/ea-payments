import assert from 'node:assert/strict';
import { buildFactoryFulfillmentRecord, canonicalClientCabinetPath } from '../lib/factory-fulfillment';

function certifiedInput() {
  return {
    projectId: 'proj-scale-cert',
    websiteStatus: 'live' as const,
    websiteUrl: 'https://example.com',
    previewPath: '/preview/example',
    portalSlug: 'example-client',
    organizationId: 'recExampleOrg',
    portalUrl: 'https://efficiencyarchitects.online/portal/example-client',
    portalLoginUrl: 'https://efficiencyarchitects.online/portal/login?next=/portal/example-client',
    portalProvisioned: true,
    loginCtaPresent: true,
    memberHomeSaved: true,
    directorGateVerified: true,
    controlPlane: {
      verified: true,
      manifestRecordId: 'recManifest',
      governanceRecordId: 'recGovernance',
      acceptanceRecordId: 'recAcceptance',
    },
  };
}

const verified = buildFactoryFulfillmentRecord(certifiedInput(), 'Example / Client');
assert.equal(verified.status, 'verified');
assert.equal(verified.blockers.length, 0);
assert.equal(verified.site.status, 'live');
assert.equal(verified.portal.status, 'provisioned');
assert.equal(verified.monitoring.registered, true);
assert.equal(verified.monitoring.targets.length, 2);
assert.equal(verified.fileCabinet.canonicalPath, '/EA Projects/02 Client Projects/Example - Client');
assert.equal(canonicalClientCabinetPath('Acme: Test'), '/EA Projects/02 Client Projects/Acme- Test');

const noPortal = buildFactoryFulfillmentRecord({ ...certifiedInput(), portalProvisioned: false }, 'No Portal');
assert.equal(noPortal.status, 'blocked');
assert.match(noPortal.blockers.join(' '), /Portal access is not provisioned/);

const noControlPlane = buildFactoryFulfillmentRecord({
  ...certifiedInput(),
  controlPlane: { verified: false },
}, 'No Control Plane');
assert.equal(noControlPlane.status, 'blocked');
assert.match(noControlPlane.blockers.join(' '), /Control Plane acceptance/);

const draftOnly = buildFactoryFulfillmentRecord({
  ...certifiedInput(),
  websiteStatus: 'draft_only',
  websiteUrl: undefined,
}, 'Draft Client');
assert.equal(draftOnly.status, 'review_required');
assert.match(draftOnly.blockers.join(' '), /draft-only/);
assert.equal(draftOnly.completedAt, undefined);

const missingQa = buildFactoryFulfillmentRecord({
  ...certifiedInput(),
  loginCtaPresent: false,
}, 'Missing QA');
assert.equal(missingQa.status, 'blocked');
assert.match(missingQa.blockers.join(' '), /login CTA/);

console.log('Factory fulfillment contract: PASS');
