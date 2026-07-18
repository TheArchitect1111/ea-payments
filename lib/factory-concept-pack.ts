/**
 * Sit-down Concept Pack — what a founder shows an interested prospect.
 *
 * Locked sections:
 * 1. Business eval & breakdown
 * 2. Website / landing concept
 * 3. Portal concept
 * 4. Member concept
 * + cover + clear ask
 *
 * Labeled as Concept Pack (preview), not finished production.
 */
import {
  buildFactoryCapacityScorecard,
  formatUsdRange,
  type FactoryCapacityScorecard,
} from '@/lib/factory-capacity-score';
import { buildFactoryClientPackage } from '@/lib/factory-client-package';
import {
  renderLandingMockup,
  renderMemberMockup,
  renderPortalMockup,
} from '@/lib/factory-concept-mockups';
import { isSyntheticPhotoClient } from '@/lib/factory-research/image-signal';
import type { FactoryProject } from '@/lib/factory-project-store';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const CREAM = '#F8F6F2';

function isJunkCopy(text: string | undefined): boolean {
  if (!text?.trim()) return true;
  return /screenshot submitted|source page:.*ctp\/assets|evaluate visible messaging|upload:\/\//i.test(
    text,
  );
}

function cleanDisplayName(name: string): string {
  const cleaned = name.replace(/^#+\s*/, '').trim();
  if (!cleaned || isSyntheticPhotoClient(cleaned) || /^screenshot\b/i.test(cleaned)) {
    return 'Your organization';
  }
  if (/efficiencyarchitects\.online/i.test(cleaned) && cleaned.length < 40) {
    return 'Your organization';
  }
  return cleaned;
}

function brandingSummary(project: FactoryProject): string | undefined {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  const summary =
    (typeof branding?.data?.visionSummary === 'string' && branding.data.visionSummary) ||
    (typeof branding?.data?.whatTheyDo === 'string' && branding.data.whatTheyDo) ||
    undefined;
  return summary && !isJunkCopy(summary) ? summary.trim().slice(0, 220) : undefined;
}

export type FactoryConceptPack = {
  version: 1;
  label: 'Concept Pack';
  clientName: string;
  projectId: string;
  coverLine: string;
  sourceUrl?: string;
  heroImageUrl?: string;
  scorecard: FactoryCapacityScorecard;
  eval: {
    headline: string;
    bullets: string[];
    opportunities: string[];
  };
  landing: {
    headline: string;
    subhead: string;
    cta: string;
    points: string[];
  };
  portal: {
    headline: string;
    modules: string[];
  };
  member: {
    headline: string;
    modules: string[];
  };
  ask: string;
};

type ArtifactLike = { kind?: string; data?: Record<string, unknown> };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function artifactList(project: FactoryProject): ArtifactLike[] {
  return (project.context?.artifacts || []) as ArtifactLike[];
}

function pickOpportunities(project: FactoryProject, fallback: string[]): string[] {
  const arts = artifactList(project);
  const rec = [...arts].reverse().find((a) => a.kind === 'recommendations');
  const items = (rec?.data as { items?: unknown[] } | undefined)?.items;
  if (Array.isArray(items) && items.length) {
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        const r = asRecord(item);
        return str(r?.title) || str(r?.text) || str(r?.summary) || '';
      })
      .filter(Boolean)
      .slice(0, 5);
  }
  const auto = [...arts].reverse().find((a) => a.kind === 'automation_opportunities');
  const autoItems = (auto?.data as { items?: unknown[] } | undefined)?.items;
  if (Array.isArray(autoItems) && autoItems.length) {
    return autoItems
      .map((item) => (typeof item === 'string' ? item : str(asRecord(item)?.title) || ''))
      .filter(Boolean)
      .slice(0, 5);
  }
  return fallback;
}

function brandingCta(project: FactoryProject): string | undefined {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  const cta = branding?.data?.cta;
  return typeof cta === 'string' && cta.trim() ? cta.trim().slice(0, 40) : undefined;
}

export function buildFactoryConceptPack(project: FactoryProject): FactoryConceptPack {
  const base = buildFactoryClientPackage(project);
  const scorecard = buildFactoryCapacityScorecard(project);
  const clientName = cleanDisplayName(
    (!isJunkCopy(base.siteSnapshot.title) && base.siteSnapshot.title) || project.client,
  );
  const description =
    brandingSummary(project) ||
    (!isJunkCopy(base.siteSnapshot.description) ? base.siteSnapshot.description : undefined) ||
    `${clientName} gets a clear public face, an ops portal to run the work, and a member home that keeps people connected.`;
  const fromPhoto = Boolean(
    (project.attachments || []).some((a) => a.type === 'image') &&
      !(project.url && !/\/api\/ctp\/assets\//i.test(project.url)),
  );

  const opportunities = pickOpportunities(project, [
    ...base.recommendations.filter((r) => !isJunkCopy(r)),
    ...scorecard.gaps,
  ]).slice(0, 5);
  while (opportunities.length < 3) {
    opportunities.push(
      [
        'Turn interest into one clear next step on the public site',
        'Run registrations, payments, and follow-up from one ops portal',
        'Give members a home for progress, schedule, and belonging',
      ][opportunities.length],
    );
  }

  const evalBullets = [
    `Capacity score: ${scorecard.overallScore}/100 (benchmark ~${scorecard.benchmark}/100).`,
    scorecard.capacityLost.headline,
    scorecard.opportunityGained.headline,
    fromPhoto
      ? 'Signal: launch photo (sit-down Concept Pack — not a finished website audit).'
      : project.url
        ? `Signal: ${project.url}.`
        : 'Signal: launch notes.',
    description,
  ];

  const cta = brandingCta(project) || 'Join the journey';

  return {
    version: 1,
    label: 'Concept Pack',
    clientName,
    projectId: project.id,
    coverLine: `Show the product: website → ops portal → member home for ${clientName}.`,
    sourceUrl: project.url && !/\/api\/ctp\/assets\//i.test(project.url) ? project.url : undefined,
    heroImageUrl: base.imageUrls[0] || base.siteSnapshot.imageUrl,
    scorecard,
    eval: {
      headline: 'The numbers (why this matters)',
      bullets: evalBullets,
      opportunities,
    },
    landing: {
      headline: clientName,
      subhead: description.slice(0, 220),
      cta,
      points: ['Get started', 'Develop', 'Compete / engage', 'Get seen', 'Belong'],
    },
    portal: {
      headline: `${clientName} Ops Portal`,
      modules: [
        'Dashboard',
        'People / members',
        'Teams / programs',
        'Events & schedule',
        'Payments',
        'Communications',
      ],
    },
    member: {
      headline: `${clientName} Member Home`,
      modules: ['Dashboard', 'My journey', 'Schedule', 'Resources', 'Messages', 'Profile'],
    },
    ask: 'If this direction feels right, approve the next step: refine the Skin Brief and move toward build.',
  };
}

export function exportFactoryConceptPackMarkdown(pack: FactoryConceptPack): string {
  const s = pack.scorecard;
  return [
    `# ${pack.clientName} — ${pack.label}`,
    '',
    `_${pack.coverLine}_`,
    '',
    `Project: ${pack.projectId}`,
    pack.sourceUrl ? `Website: ${pack.sourceUrl}` : '',
    '',
    pack.heroImageUrl ? `Source image: ${pack.heroImageUrl}` : '',
    '',
    '## Capacity score',
    '',
    `**${s.overallScore}/100** (benchmark ~${s.benchmark}/100)`,
    '',
    `- Visibility ${s.scores.visibility}/100`,
    `- Exposure ${s.scores.exposure}/100`,
    `- Conversion ${s.scores.conversion}/100`,
    `- Differentiation ${s.scores.differentiation}/100`,
    `- Modernity ${s.scores.modernity}/100`,
    `- Trust ${s.scores.trust}/100`,
    '',
    '## Capacity lost (annual estimate)',
    '',
    s.capacityLost.headline,
    '',
    ...s.capacityLost.breakdown.map(
      (line) =>
        `- **${line.label}:** ${formatUsdRange(line.annualLow, line.annualHigh)}/yr — ${line.why}`,
    ),
    '',
    '## Potential opportunity gained',
    '',
    s.opportunityGained.headline,
    '',
    `_${s.opportunityGained.assumption}_`,
    '',
    `## 1. ${pack.eval.headline}`,
    '',
    ...pack.eval.bullets.map((b) => `- ${b}`),
    '',
    '### Opportunities',
    '',
    ...pack.eval.opportunities.map((o) => `- ${o}`),
    '',
    '## Product mockups (see HTML email for branded visuals)',
    '',
    '### 1. Website / landing',
    pack.landing.subhead,
    `CTA: ${pack.landing.cta}`,
    ...pack.landing.points.map((p) => `- ${p}`),
    '',
    '### 2. Ops / client portal',
    ...pack.portal.modules.map((m) => `- ${m}`),
    '',
    '### 3. Member home',
    ...pack.member.modules.map((m) => `- ${m}`),
    '',
    '## The ask',
    '',
    pack.ask,
    '',
    '---',
    '',
    '_Visual mockups are in the HTML email — this file is the data + outline._',
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

/** HTML for email body + printable sit-down preview. */
export function renderFactoryConceptPackEmailHtml(
  pack: FactoryConceptPack,
  escHtml: (s: string) => string,
): string {
  const evalBullets = pack.eval.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('');
  const opps = pack.eval.opportunities.map((o) => `<li>${escHtml(o)}</li>`).join('');
  const s = pack.scorecard;
  const lostShort = formatUsdRange(s.capacityLost.annualLow, s.capacityLost.annualHigh);
  const gainedShort = formatUsdRange(s.opportunityGained.annualLow, s.opportunityGained.annualHigh);

  const mockInput = {
    clientName: pack.clientName,
    tagline: pack.landing.subhead,
    cta: pack.landing.cta,
    heroImageUrl: pack.heroImageUrl,
    score: s.overallScore,
    capacityLostLabel: lostShort,
    opportunityLabel: gainedShort,
    landingSections: pack.landing.points,
    portalNav: pack.portal.modules,
    memberNav: pack.member.modules,
    escHtml,
  };

  const landingScreen = renderLandingMockup(mockInput);
  const portalScreen = renderPortalMockup(mockInput);
  const memberScreen = renderMemberMockup(mockInput);
  const breakdownRows = s.capacityLost.breakdown
    .map(
      (line) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;font-size:13px;color:#333;">${escHtml(line.label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e8e4dc;font-size:13px;color:${NAVY};font-weight:700;text-align:right;">${escHtml(formatUsdRange(line.annualLow, line.annualHigh))}/yr</td>
      </tr>`,
    )
    .join('');

  return `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${escHtml(pack.label)} · Preview</p>
    <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:${NAVY};">${escHtml(pack.clientName)}</h1>
    <p style="margin:0 0 8px;font-size:16px;color:#1A1A2E;line-height:1.6;">${escHtml(pack.coverLine)}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#555;line-height:1.5;">Sit-down pack: <strong>proof numbers</strong> + <strong>three branded product mockups</strong> (website, ops portal, member home).</p>
    <p style="margin:0 0 18px;font-size:12px;color:#888;">Project ${escHtml(pack.projectId)}${pack.sourceUrl ? ` · ${escHtml(pack.sourceUrl)}` : ''}</p>

    ${
      pack.heroImageUrl
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">Source photo</p>
        <img src="${escHtml(pack.heroImageUrl)}" alt="Launch photo" width="560" style="width:100%;max-width:560px;height:auto;display:block;border:0;" />
      </td></tr>
    </table>`
        : ''
    }

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
      <tr>
        <td width="33%" style="padding:14px;background:${NAVY};vertical-align:top;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">Score</p>
          <p style="margin:0;font-size:32px;font-weight:800;color:#fff;line-height:1;">${s.overallScore}<span style="font-size:14px;font-weight:600;color:rgba(255,255,255,.75);">/100</span></p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,.7);">Benchmark ~${s.benchmark}</p>
        </td>
        <td width="34%" style="padding:14px;background:#3a2a1a;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#f0c36a;">Capacity lost</p>
          <p style="margin:0;font-size:18px;font-weight:800;color:#fff;line-height:1.25;">${escHtml(formatUsdRange(s.capacityLost.annualLow, s.capacityLost.annualHigh))}</p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,.7);">per year (est.)</p>
        </td>
        <td width="33%" style="padding:14px;background:#1e3d2f;vertical-align:top;">
          <p style="margin:0 0 6px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#8fd6a8;">Opportunity gained</p>
          <p style="margin:0;font-size:18px;font-weight:800;color:#fff;line-height:1.25;">${escHtml(formatUsdRange(s.opportunityGained.annualLow, s.opportunityGained.annualHigh))}</p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,.7);">per year (est.)</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:${CREAM};">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${NAVY};">Capacity lost breakdown</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${breakdownRows}</table>
          <p style="margin:12px 0 0;font-size:11px;color:#888;line-height:1.5;">${escHtml(s.opportunityGained.assumption)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;background:${CREAM};border-left:4px solid ${GOLD};">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${NAVY};">${escHtml(pack.eval.headline)}</p>
          <ul style="margin:0 0 12px;padding-left:18px;font-size:14px;color:#555;line-height:1.7;">${evalBullets}</ul>
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:${NAVY};">Opportunities</p>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:#555;line-height:1.7;">${opps}</ul>
        </td>
      </tr>
    </table>

    ${landingScreen}
    ${portalScreen}
    ${memberScreen}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;background:${NAVY};">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">The ask</p>
          <p style="margin:0;font-size:15px;color:#fff;line-height:1.6;">${escHtml(pack.ask)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:11px;color:#999;line-height:1.5;">Concept Pack for discussion — not a finished production website or portal.</p>
  `;
}

/** Standalone printable HTML document for in-room demos. */
export function renderFactoryConceptPackDocument(pack: FactoryConceptPack): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = renderFactoryConceptPackEmailHtml(pack, esc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(pack.clientName)} — Concept Pack</title>
  <style>
    body { margin:0; background:${CREAM}; font-family: Georgia, 'Times New Roman', serif; }
    .wrap { max-width:640px; margin:0 auto; padding:28px 18px 48px; }
    @media print { body { background:#fff; } .wrap { padding:0; } }
  </style>
</head>
<body>
  <div class="wrap">${body}</div>
</body>
</html>`;
}
