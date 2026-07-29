/**
 * Experience Creation Engine contracts.
 * Run: npx --yes tsx scripts/test-experience-creation-engine.ts
 */
import assert from 'node:assert/strict';
import { buildSubjectKnowledgePack } from '../lib/experience-creation/build-knowledge-pack';
import { buildMediaBrandPack } from '../lib/experience-creation/build-media-pack';
import { buildContentCreativePack } from '../lib/experience-creation/build-content-creative-pack';
import { buildExperienceManifests } from '../lib/experience-creation/build-experience-manifests';
import { evaluateExperienceCritic } from '../lib/experience-creation/critic';
import { findForbiddenPublicCopy } from '../lib/factory-forbidden-copy.mjs';
import type { FactoryProject } from '../lib/factory-project-store';
import type { ResearchProviderAdapter } from '../lib/experience-creation/research-adapter';

const stubAdapter: ResearchProviderAdapter = {
  id: 'test-stub',
  configured: true,
  async search() {
    return [
      {
        title: 'Duke profile',
        url: 'https://example.com/duke-brickey',
        description: 'Robert Brickey played basketball at Duke University.',
        provider: 'test',
      },
      {
        title: 'EA',
        url: 'https://example.com/efficiency-architects',
        description: 'Efficiency Architects helps organizations build capacity.',
        provider: 'test',
      },
      {
        title: 'Charlotte',
        url: 'https://example.com/charlotte',
        description: 'Based in Charlotte, North Carolina.',
        provider: 'test',
      },
    ];
  },
  async fetchPage(url) {
    return {
      url,
      title: 'Page',
      description: 'Robert Brickey — public profile evidence for testing.',
      text: 'Robert Brickey — public profile evidence for testing. Duke. Efficiency Architects. Charlotte.',
      imageUrls: ['https://example.com/preview.jpg'],
      provider: 'test',
    };
  },
};

const project = {
  version: 1,
  id: 'proj-ms6046mq-efc59b',
  client: 'Robert Brickey',
  goal: 'Research the subject and produce a matched website and portal experience',
  deliverable: 'Website + Portal',
  pipelineStatus: 'BUILDING',
  createdAt: '2026-07-29T12:00:00.000Z',
  updatedAt: '2026-07-29T12:00:00.000Z',
  notes:
    'Distinguishing detail: Former Duke basketball captain and founder of Efficiency Architects in Charlotte, North Carolina\nSource: Universal Quick Launch',
  attachments: [],
  source: 'admin',
  activity: [],
} as FactoryProject;

async function main() {
  const knowledge = await buildSubjectKnowledgePack(project, stubAdapter);
  assert.ok(knowledge.claims.length >= 3, 'knowledge claims');
  assert.ok(knowledge.biography.length >= 40, 'biography');
  const publicSlice = {
    biography: knowledge.biography,
    claims: knowledge.claims,
    timeline: knowledge.timeline,
    currentWork: knowledge.currentWork,
    organizations: knowledge.organizations,
  };
  const leak = findForbiddenPublicCopy(publicSlice);
  assert.equal(leak.ok, true, `forbidden in public knowledge: ${leak.matches.join(' | ')}`);
  assert.ok(!knowledge.biography.includes('Research the subject'));
  assert.ok(!knowledge.claims.some((c) => /Research the subject|matched website/i.test(c.text)));

  const media = buildMediaBrandPack(project, knowledge);
  // Stub pages did not attach images into media pack from knowledge alone — typography-led ok
  assert.ok(media.validation.ok || media.intentionalTypographyLed);

  const content = await buildContentCreativePack(knowledge, media);
  assert.equal(content.premises.length, 3);
  const headlines = new Set(content.premises.map((p) => p.heroHeadline));
  assert.equal(headlines.size, 3, 'distinct premise headlines');
  assert.equal(findForbiddenPublicCopy(content).ok, true);
  assert.ok(!JSON.stringify(content).includes('exists to help the people it serves'));
  assert.ok(!JSON.stringify(content).includes(project.goal));

  const manifests = buildExperienceManifests({
    knowledge,
    media: { ...media, intentionalTypographyLed: true, assets: [], validation: { ok: true, reasons: [] } },
    content,
    projectId: project.id,
    returnToConceptsHref: `/admin/ea-factory/quick-launch?projectId=${project.id}`,
    portalLoginHref: '/portal/login',
  });
  assert.equal(manifests.length, 3);
  for (const m of manifests) {
    assert.ok(!m.ctaBehavior.secondaryHref.includes('/sites/'));
    assert.match(m.ctaBehavior.secondaryLabel, /return/i);
  }

  const critic = evaluateExperienceCritic({
    knowledge: { ...knowledge, validation: { ok: true, reasons: [] } },
    media: { ...media, intentionalTypographyLed: true, assets: [], validation: { ok: true, reasons: [] } },
    content,
    manifests,
  });
  assert.equal(critic.scores.linkIntegrity, 100);
  assert.equal(critic.scores.internalTextLeakage, 0);

  console.log('test-experience-creation-engine.ts: ok', {
    claims: knowledge.claims.length,
    premises: content.premises.map((p) => p.name),
    criticOk: critic.ok,
    reasons: critic.reasons,
  });
}

void main();
