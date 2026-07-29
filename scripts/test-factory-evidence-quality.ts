/**
 * Evidence quality + near-name rejection.
 * Run: npx --yes tsx scripts/test-factory-evidence-quality.ts
 */
import assert from 'node:assert/strict';
import {
  evaluateEvidenceQuality,
  isEvidenceRelevantToSubject,
} from '../lib/factory-evidence-quality';
import { evaluateConceptQualityGate } from '../lib/factory-concept-quality-gate';
import type { ContentPackage } from '../lib/factory-content-package';

assert.equal(
  isEvidenceRelevantToSubject(
    'Kristina Brickey',
    'Kristina Behringer is a biographical subject in an encyclopedia entry.',
  ),
  false,
);
assert.equal(
  isEvidenceRelevantToSubject(
    'Kristina Brickey',
    'Kristina Burkey appeared in local news without confirmation.',
  ),
  false,
);
assert.equal(
  isEvidenceRelevantToSubject(
    'Kristina Brickey',
    'Kristina Brickey serves as Clinical Liaison at 3HC.',
    'https://example.com/3hc',
  ),
  true,
);

const roleOrg = evaluateEvidenceQuality({
  subjectName: 'Kristina Brickey',
  identityStatus: 'resolved',
  claims: [
    {
      text: 'Kristina Brickey is Clinical Liaison at 3HC.',
      status: 'verified',
      sourceUrl: 'https://example.com/3hc/team',
    },
  ],
  organizations: ['3HC'],
  professionalRoles: ['Clinical Liaison'],
  biography: 'Kristina Brickey serves families through clinical liaison work at 3HC.',
  sources: [{ url: 'https://example.com/3hc/team' }],
});
assert.equal(roleOrg.ok, true, roleOrg.reasons.join('; '));
assert.equal(roleOrg.mode, 'role_org_draft');

const blocked = evaluateEvidenceQuality({
  subjectName: 'Kristina Brickey',
  identityStatus: 'ambiguous',
  claims: [],
});
assert.equal(blocked.ok, false);

const thinPack = {
  schemaVersion: 1 as const,
  generatedAt: new Date().toISOString(),
  projectId: 'proj-ms68dh4m-3daac7',
  name: 'Kristina Brickey',
  positioning: 'Clinical Liaison at 3HC',
  centralStory: 'Kristina Brickey supports patients and families as Clinical Liaison at 3HC.',
  biography: 'Kristina Brickey supports patients and families as Clinical Liaison at 3HC.',
  milestones: [],
  accomplishments: [],
  currentWork: ['Clinical Liaison at 3HC'],
  organizations: ['3HC'],
  audience: 'Patients and families',
  callsToAction: ['Start a conversation'],
  mediaPlan: { strategy: 'preview', items: [] },
  claims: [
    {
      text: 'Kristina Brickey is Clinical Liaison at 3HC.',
      status: 'verified' as const,
      sourceUrl: 'https://example.com/3hc',
    },
  ],
  sources: [{ url: 'https://example.com/3hc', label: '3HC' }],
  lenses: {
    cinematic: {
      heroHeadline: 'Care that stays close',
      heroSupporting: 'Clinical liaison support for families',
      aboutTitle: 'About',
      aboutBody: 'Kristina Brickey supports patients and families as Clinical Liaison at 3HC.',
      sectionHeadlines: ['Care', 'Family', 'Next'],
      sectionBodies: ['Care', 'Family', 'Next step'],
      ctaLabel: 'Continue',
      portalPurpose: 'A calm place to continue care conversations.',
    },
    editorial: {
      heroHeadline: 'A clinical liaison profile',
      heroSupporting: '3HC',
      aboutTitle: 'Profile',
      aboutBody: 'Kristina Brickey supports patients and families as Clinical Liaison at 3HC.',
      sectionHeadlines: ['Role', 'Organization', 'Invitation'],
      sectionBodies: ['Role', 'Organization', 'Invitation'],
      ctaLabel: 'Continue',
      portalPurpose: 'Briefing workspace',
    },
    intimate: {
      heroHeadline: 'Meet Kristina',
      heroSupporting: 'Clinical liaison at 3HC',
      aboutTitle: 'Introduction',
      aboutBody: 'Kristina Brickey supports patients and families as Clinical Liaison at 3HC.',
      sectionHeadlines: ['Trust', 'Work', 'Begin'],
      sectionBodies: ['Trust', 'Work', 'Begin'],
      ctaLabel: 'Continue',
      portalPurpose: 'Companion workspace',
    },
  },
  quality: { factCount: 1, sourceCount: 1, ready: true, missing: [] },
} satisfies ContentPackage;

const gateWithoutPreviews = evaluateConceptQualityGate({
  contentPackage: thinPack,
  previews: null,
});
assert.equal(gateWithoutPreviews.ok, false);
assert.ok(!gateWithoutPreviews.reasons.some((r) => /three meaningful verified facts/i.test(r)));

console.log('test-factory-evidence-quality.ts: ok');
