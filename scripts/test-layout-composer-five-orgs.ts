/**
 * Success criteria: five organizations → visually distinct directed websites,
 * Experience Director overall ≥ 80, no EAFeatures fallback.
 *
 * Run: npx --yes tsx scripts/test-layout-composer-five-orgs.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateExperienceForDirector } from '../lib/factory-experience-director';
import {
  composeDirectedWebsite,
  puckContainsFeatureCards,
} from '../lib/layout-composer';

const orgs = [
  {
    slug: 'bgca',
    organizationName: 'Boys & Girls Clubs of America',
    industry: 'Youth development',
    primaryAudience: 'Parents, supporters, and community leaders',
    whoTheyAre:
      'A national movement of local Clubs that keep kids future-ready when the school day ends — safe places, caring adults, and peers who believe in them.',
    mission:
      'Ensure every young person who enters a Club has the opportunity to thrive, lead, and shape America tomorrow.',
    story:
      'America Needs Club Kids. Tomorrow leaders are growing up in Boys & Girls Clubs.',
    whyTheyExist:
      'Millions of kids lack supervised enriching after-school time. Clubs close that gap with belonging.',
    whoTheyHelp: 'Kids and teens who need a Club after school',
    whyItMatters:
      '7.7 million kids are alone after school while nearly 25 million lack after-school access.',
    whatChanges:
      'Kids move from unsupervised hours to belonging, leadership, and plans after high school.',
    differentiators: [
      'Youth of the Year',
      'Local Club belonging at national scale',
      'Outcome evidence',
    ],
    brandHeadline: 'America Needs Club Kids',
    brandSubhead: 'When kids have a Club, they thrive — and so does the country.',
    brandCta: 'Find a Club Near You',
    primaryColor: '#0033A0',
    accentColor: '#E87722',
  },
  {
    slug: 'oak-restorations',
    organizationName: 'Oak Street Restorations',
    industry: 'Historic building restoration',
    primaryAudience: 'Owners of heritage buildings and civic stewards',
    whoTheyAre:
      'Craftspeople who restore weathered buildings to dignity without erasing their history.',
    mission: 'Bring damaged heritage structures back to whole, usable life.',
    story:
      'We reclaim what time and neglect nearly took — rooms, facades, and civic landmarks.',
    whyTheyExist: 'Heritage buildings fail quietly until repair becomes impossible.',
    whoTheyHelp: 'Property stewards who refuse to demolish what still has soul',
    whyItMatters: 'Once a facade is gone, the street forgets who it was.',
    whatChanges: 'From deferred decay to restored integrity people can inhabit again.',
    differentiators: [
      'Material-honest repair',
      'Before/after with context',
      'No shame for the past',
    ],
    brandHeadline: 'Restore what still matters',
    brandSubhead: 'Careful repair for buildings that carry a town memory.',
    brandCta: 'Begin a restoration',
    primaryColor: '#3E2F24',
    accentColor: '#B08D57',
  },
  {
    slug: 'harbor-shield',
    organizationName: 'Harbor Shield Mutual',
    industry: 'Insurance and risk protection',
    primaryAudience: 'Families and small businesses who need dependable coverage',
    whoTheyAre:
      'A mutual that protects what people have built — calmly, clearly, without fear theater.',
    mission: 'Keep households and shops secure when disruption arrives.',
    story: 'Protection should feel like a steady boundary, not a maze of fine print.',
    whyTheyExist: 'People lose sleep when coverage is confusing or absent.',
    whoTheyHelp: 'Families and operators who need to know they are covered',
    whyItMatters: 'One uncovered event can undo years of careful work.',
    whatChanges: 'From anxious guesswork to clear protection and a known next step.',
    differentiators: [
      'Plain-language policies',
      'Stewardship over scare tactics',
      'Local claims care',
    ],
    brandHeadline: 'Protection that stays quiet until you need it',
    brandSubhead: 'Coverage with clarity — so you can focus on what you are building.',
    brandCta: 'Review your coverage',
    primaryColor: '#0F1C2E',
    accentColor: '#C9A844',
  },
  {
    slug: 'northline-guide',
    organizationName: 'Northline Coaching',
    industry: 'Executive coaching',
    primaryAudience: 'Leaders navigating complex transitions',
    whoTheyAre: 'Guides who walk beside leaders until the path is clear again.',
    mission: 'Help leaders move from fog to a next step they trust.',
    story:
      'You do not need another framework dump — you need someone who walks with you.',
    whyTheyExist:
      'High-capacity people get stuck alone with decisions that reshape teams.',
    whoTheyHelp: 'Executives and founders in transition',
    whyItMatters: 'When leaders freeze, organizations drift.',
    whatChanges: 'From isolated overwhelm to calm clarity and a shared next move.',
    differentiators: [
      'Companion pacing',
      'Conversation over kits',
      'Clarity before intensity',
    ],
    brandHeadline: 'You are not alone in the fog',
    brandSubhead: 'Guided coaching that restores calm confidence.',
    brandCta: 'Start a conversation',
    primaryColor: '#1B2B4D',
    accentColor: '#C9A844',
  },
  {
    slug: 'river-atelier',
    organizationName: 'River Atelier',
    industry: 'Custom furniture craft',
    primaryAudience: 'Clients commissioning heirloom pieces',
    whoTheyAre:
      'Craftsmen who make furniture with material honesty and patient mastery.',
    mission: 'Commission work that will be lived with for decades.',
    story:
      'Every piece begins with wood, hand, and time — never a catalog compromise.',
    whyTheyExist:
      'Disposable furniture teaches people to expect less from the made world.',
    whoTheyHelp: 'People who want objects made with respect',
    whyItMatters: 'Craft is how we keep beauty useful across generations.',
    whatChanges: 'From generic fill to a piece that earns its place in a home.',
    differentiators: ['Bespoke joinery', 'Process you can see', 'Material-first design'],
    brandHeadline: 'Made with mastery',
    brandSubhead: 'Commission furniture shaped by hand, wood, and patience.',
    brandCta: 'Commission a piece',
    primaryColor: '#1A1714',
    accentColor: '#8B5E3C',
  },
];

function packFromOrg(org: (typeof orgs)[number]) {
  return {
    industry: org.industry,
    opportunityBrief: {
      organization: org.organizationName,
      industry: org.industry,
      whoTheyAre: org.whoTheyAre,
      mission: org.mission,
      audience: org.primaryAudience,
      whoTheyHelp: org.whoTheyHelp,
      whyItMatters: org.whyItMatters,
      stakes: org.whyItMatters,
      whatChanges: org.whatChanges,
      outcomes: org.whatChanges,
      brand: {
        headline: org.brandHeadline,
        voice: org.brandSubhead,
        primary: org.primaryColor,
        accent: org.accentColor,
      },
      member: {
        whereYouAre: `Connected to ${org.organizationName} workspace.`,
        whatNext: 'Continue with the next guided step.',
        purpose: org.mission,
        whatSuccessLooksLike: org.whatChanges,
      },
    },
  };
}

const outDir = join(process.cwd(), 'prototypes/website-director-golden-path/five-org-run');
mkdirSync(outDir, { recursive: true });

const results: Array<Record<string, unknown>> = [];
const failures: string[] = [];

for (const org of orgs) {
  const composed = composeDirectedWebsite({
    organization: org,
    portalLoginHref: '/portal/login',
    sitePath: `/sites/${org.slug}`,
    primaryColor: org.primaryColor,
    accentColor: org.accentColor,
  });

  if (puckContainsFeatureCards(composed.puckData)) {
    failures.push(`${org.slug}: emitted EAFeatures`);
  }

  const review = evaluateExperienceForDirector({
    projectId: `gp-${org.slug}`,
    blueprintRef: `layout-composer:${org.slug}`,
    site: composed.websiteSite,
    pack: packFromOrg(org),
  });

  if (review.scores.overall < 80 || review.approvalStatus !== 'Approved') {
    failures.push(
      `${org.slug}: ED ${review.approvalStatus} overall=${review.scores.overall} improvements=${review.requiredImprovements.join('; ')}`,
    );
  }

  results.push({
    slug: org.slug,
    organizationName: org.organizationName,
    primaryArchetype: composed.director.creativeDirection.primaryArchetype,
    blend: composed.director.classification.blend,
    sceneOrder: composed.composed.scenes.map((s) => s.role),
    compositionSignature: composed.composed.compositionSignature,
    blockTypes: composed.puckData.content.map((b) => b.type),
    experienceDirector: {
      approvalStatus: review.approvalStatus,
      overall: review.scores.overall,
      scores: review.scores,
    },
  });

  writeFileSync(
    join(outDir, `${org.slug}-website_site.json`),
    JSON.stringify(composed.websiteSite, null, 2),
  );
  writeFileSync(join(outDir, `${org.slug}-puck.json`), JSON.stringify(composed.puckData, null, 2));
}

const signatures = new Set(results.map((r) => String(r.compositionSignature)));
if (signatures.size < 5) {
  failures.push(`Expected 5 distinct composition signatures, got ${signatures.size}`);
}

const archetypes = new Set(results.map((r) => String(r.primaryArchetype)));
if (archetypes.size < 4) {
  failures.push(
    `Expected ≥4 distinct primary archetypes, got ${archetypes.size}: ${[...archetypes].join(', ')}`,
  );
}

const sceneOrders = new Set(
  results.map((r) => (r.sceneOrder as string[]).join('>')),
);
if (sceneOrders.size < 3) {
  failures.push(`Expected ≥3 distinct scene orders, got ${sceneOrders.size}`);
}

writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ results, failures }, null, 2));
console.log(JSON.stringify({ results, failures }, null, 2));

if (failures.length) {
  console.error('FAIL layout-composer-five-orgs');
  process.exit(1);
}

console.log('PASS layout-composer-five-orgs — 5 distinct directed sites, ED ≥80');
