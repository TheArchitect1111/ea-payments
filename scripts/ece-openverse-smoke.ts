/**
 * Openverse acceptance smoke for three ECE subjects.
 * Run: npx --yes tsx scripts/ece-openverse-smoke.ts
 */
import {
  searchOpenverseImages,
  canPublishMediaAsset,
} from '../lib/experience-creation/openverse-provider';

const SUBJECTS = [
  {
    name: 'Robert Brickey',
    organization: 'Duke',
    location: 'Charlotte',
    theme: 'basketball',
  },
  {
    name: 'Brickey Botanicals',
    organization: 'botanical garden',
    theme: 'botanical plants greenhouse nursery',
  },
  {
    name: 'Ascension Circle',
    organization: 'community gathering',
    theme: 'community circle gathering people',
  },
];

async function main() {
  const report = [];
  for (const subject of SUBJECTS) {
    const items = await searchOpenverseImages({
      subject: subject.name,
      organization: subject.organization,
      location: 'location' in subject ? subject.location : undefined,
      theme: subject.theme,
      pageSize: 8,
    });
    const selected = items.filter((i) => i.usageStatus !== 'rejected').slice(0, 3);
    const rejected = items.filter((i) => i.usageStatus === 'rejected');
    report.push({
      subject: subject.name,
      total: items.length,
      selected: selected.map((i) => ({
        title: i.title,
        license: i.license,
        licenseClass: i.licenseClass,
        attribution: i.attribution,
        licenseVerified: i.licenseVerified,
        usageStatus: i.usageStatus,
        canPublish: canPublishMediaAsset({
          usageStatus: i.usageStatus,
          licenseClass: i.licenseClass,
          licenseVerified: i.licenseVerified,
          publicationEligible: false,
        }),
      })),
      rejectedCount: rejected.length,
      rejectedSample: rejected.slice(0, 2).map((i) => ({
        title: i.title,
        reason: i.rejectionReason,
      })),
    });
  }
  console.log(JSON.stringify({ ok: true, report }, null, 2));
}

void main();
