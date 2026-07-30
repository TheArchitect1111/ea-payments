/**
 * Live three-subject crawl — supplied official domains are authoritative.
 * Requires worker health. Does NOT mock crawl responses.
 */
import assert from 'node:assert/strict';
import { createCrawl4AIResearchProvider } from '../lib/uxg/research/crawl4ai-provider';
import { workerHealthCheck, getWorkerClientConfig } from '../lib/uxg/research/client';
import { resolveIdentityCandidates } from '../lib/uxg/research/identity-resolve';
import { buildBrandProfile } from '../lib/uxg/research/map-to-packs';
import {
  parseResearchCrawlRequest,
  scoreResearchCrawlCompleteness,
  type ResearchCrawlResult,
} from '../lib/uxg/research/schemas';

type SubjectCase = {
  name: string;
  detail: string;
  knownUrls: string[];
  expectDomain: string;
  expectEntity: 'person' | 'organization';
  employerAffiliated?: boolean;
  mustRejectDomains?: string[];
};

const SUBJECTS: SubjectCase[] = [
  {
    name: 'Brickey Botanicals',
    detail: 'botanical skincare business North Carolina',
    knownUrls: ['https://brickeybotanicals.com/'],
    expectDomain: 'brickeybotanicals.com',
    expectEntity: 'organization',
  },
  {
    name: 'Ascension Circle',
    detail: 'nonprofit community programs mission',
    knownUrls: ['https://ascensioncircle.org'],
    expectDomain: 'ascensioncircle.org',
    expectEntity: 'organization',
    mustRejectDomains: ['ascensionacademy.com'],
  },
  {
    name: 'Kristina Brickey',
    detail: 'patient care liaison 3HC home health North Carolina',
    knownUrls: ['https://www.3hc.org/'],
    expectDomain: '3hc.org',
    expectEntity: 'person',
    employerAffiliated: true,
    mustRejectDomains: ['duke.edu', 'goduke.com'],
  },
];

function applyIdentityToCrawl(
  crawl: ResearchCrawlResult,
  identity: Awaited<ReturnType<typeof resolveIdentityCandidates>>,
  subject: SubjectCase,
): ResearchCrawlResult {
  return {
    ...crawl,
    identity: {
      ...crawl.identity,
      canonicalName: subject.name,
      entityType: subject.expectEntity,
      officialDomains: [...identity.lockedOfficialDomains],
      identityVerified: identity.identityVerified,
      identityStatus: identity.identityStatus,
      clarificationQuestion: identity.clarificationQuestion,
      employerAffiliated: identity.employerAffiliation.active,
      employerDomain: identity.employerAffiliation.employerDomain,
      rejectedDomains: identity.rejectedDomains,
    },
    brandAssets: crawl.brandAssets.map((b) => ({
      ...b,
      ownership: identity.employerAffiliation.active
        ? ('employer_affiliated' as const)
        : ('subject_owned' as const),
    })),
    mediaAssets: crawl.mediaAssets.map((m) => ({
      ...m,
      ownership: identity.employerAffiliation.active
        ? ('employer_affiliated' as const)
        : ('subject_owned' as const),
    })),
  };
}

async function main() {
  const config = getWorkerClientConfig();
  if (!config) {
    console.error(JSON.stringify({ ok: false, reason: 'worker env required' }));
    process.exit(2);
  }
  if (!(await workerHealthCheck(config))) {
    console.error(JSON.stringify({ ok: false, reason: 'worker /health not ok' }));
    process.exit(2);
  }

  const provider = createCrawl4AIResearchProvider();
  const reports = [];

  for (const subject of SUBJECTS) {
    const identity = await resolveIdentityCandidates({
      subjectName: subject.name,
      distinguishingDetail: subject.detail,
      knownUrls: subject.knownUrls,
    });

    assert.deepEqual(
      identity.lockedOfficialDomains,
      [subject.expectDomain],
      `locked domain for ${subject.name}`,
    );
    assert.equal(identity.identityVerified, true);
    assert.equal(identity.officialDomains.includes(subject.expectDomain), true);

    for (const bad of subject.mustRejectDomains || []) {
      assert.equal(
        identity.officialDomains.includes(bad),
        false,
        `${bad} must not be official for ${subject.name}`,
      );
    }

    if (subject.employerAffiliated) {
      assert.equal(identity.employerAffiliation.active, true);
    }

    const request = parseResearchCrawlRequest({
      subjectName: subject.name,
      distinguishingDetail: subject.detail,
      knownUrls: identity.primarySeedUrls,
      candidateUrls: identity.candidateUrls,
      allowDomains: identity.lockedOfficialDomains,
      maxPages: Number(process.env.UXG_RESEARCH_MAX_PAGES || 4),
      crawlDepth: 2,
      jobId: `idfix-${subject.expectDomain}`,
    });

    const raw = await provider.crawl(request);
    assert.ok(raw, `crawl null for ${subject.name}`);
    const crawl = applyIdentityToCrawl(raw!, identity, subject);
    assert.deepEqual(crawl.identity.officialDomains, [subject.expectDomain]);

    const brand = buildBrandProfile(crawl);
    const completeness = scoreResearchCrawlCompleteness(crawl);
    const logos = [
      ...crawl.brandAssets.filter((b) => b.kind === 'logo' || b.kind === 'favicon' || b.kind === 'app_icon'),
    ];
    const logoFromMedia = crawl.mediaAssets.filter(
      (m) => !m.rejected && m.relevanceCategory === 'logo',
    );
    const colors = brand.colors.map((c) => c.value);
    const media = crawl.mediaAssets.filter((m) => !m.rejected);

    reports.push({
      subject: subject.name,
      identityDecision: {
        status: crawl.identity.identityStatus,
        verified: crawl.identity.identityVerified,
        entityType: crawl.identity.entityType,
        officialDomains: crawl.identity.officialDomains,
        employerAffiliated: crawl.identity.employerAffiliated,
        clarificationQuestion: crawl.identity.clarificationQuestion || null,
      },
      acceptedDomains: identity.lockedOfficialDomains,
      rejectedDomains: identity.rejectedDomains.slice(0, 12),
      completeness: {
        score: completeness.score,
        pass: completeness.pass,
        parts: completeness.parts,
        reasons: completeness.reasons,
      },
      logos: logos.length + logoFromMedia.length,
      logoFromMedia: logoFromMedia.length,
      colors: colors.slice(0, 8),
      mediaCount: media.length,
      ownership: media[0]?.ownership || logos[0]?.ownership || null,
      evidenceCount: crawl.evidence.length,
      pagesFetched: crawl.diagnostics.pagesFetched,
      crawlErrors: crawl.diagnostics.errors.slice(0, 3),
    });
  }

  const identityOk = reports.every(
    (r) =>
      r.identityDecision.verified &&
      r.acceptedDomains.length === 1 &&
      r.acceptedDomains[0] ===
        SUBJECTS.find((s) => s.name === r.subject)!.expectDomain,
  );
  const contentOk = reports.every((r) => r.pagesFetched > 0 && r.evidenceCount > 0);
  console.log(
    JSON.stringify(
      {
        ok: identityOk,
        identityOk,
        contentOk,
        reports,
      },
      null,
      2,
    ),
  );
  process.exit(identityOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
