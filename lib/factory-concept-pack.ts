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
  buildConsultantEval,
  type ConceptConsultantEval,
} from '@/lib/factory-concept-eval';
import { renderConceptSampleMockups } from '@/lib/factory-concept-mockups';
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

function brandingArtifact(project: FactoryProject): Record<string, unknown> | null {
  const branding = [...(project.context?.artifacts || [])]
    .reverse()
    .find((a) => a.kind === 'branding');
  return branding?.data && typeof branding.data === 'object'
    ? (branding.data as Record<string, unknown>)
    : null;
}

function brandingSummary(project: FactoryProject): string | undefined {
  const data = brandingArtifact(project);
  const summary =
    (typeof data?.visionSummary === 'string' && data.visionSummary) ||
    (typeof data?.whatTheyDo === 'string' && data.whatTheyDo) ||
    undefined;
  return summary && !isJunkCopy(summary) ? summary.trim().slice(0, 220) : undefined;
}

function brandingClientName(project: FactoryProject): string | undefined {
  const data = brandingArtifact(project);
  const name =
    (typeof data?.suggestedClientName === 'string' && data.suggestedClientName) ||
    (typeof data?.brandName === 'string' && data.brandName) ||
    undefined;
  if (!name || isJunkCopy(name) || isSyntheticPhotoClient(name)) return undefined;
  const cleaned = cleanDisplayName(name);
  return cleaned === 'Your organization' ? undefined : cleaned;
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
  consultant: ConceptConsultantEval;
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
  const clientName =
    brandingClientName(project) ||
    cleanDisplayName(
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

  const rawHints = pickOpportunities(project, [
    ...base.recommendations.filter((r) => !isJunkCopy(r)),
    ...scorecard.gaps,
  ]).slice(0, 5);

  const signalNote = fromPhoto
    ? 'We started from your launch photo (a sit-down concept — not a finished website audit).'
    : project.url && !/\/api\/ctp\/assets\//i.test(project.url)
      ? `We started from ${project.url}.`
      : 'We started from your launch notes.';

  const consultant = buildConsultantEval({
    clientName,
    scorecard,
    signalNote,
    summary: description,
    rawOpportunityHints: rawHints,
  });

  const cta = brandingCta(project) || 'Get started';

  return {
    version: 1,
    label: 'Concept Pack',
    clientName,
    projectId: project.id,
    coverLine: `A consultant briefing for ${clientName}: evidence, plain-English opportunities, and custom product concepts.`,
    sourceUrl: project.url && !/\/api\/ctp\/assets\//i.test(project.url) ? project.url : undefined,
    heroImageUrl: base.imageUrls[0] || base.siteSnapshot.imageUrl,
    scorecard,
    consultant,
    eval: {
      headline: consultant.headline,
      bullets: consultant.bullets,
      opportunities: consultant.opportunityLines,
    },
    landing: {
      headline: clientName,
      subhead: description.slice(0, 220),
      cta,
      points: ['Get started', 'Learn', 'Engage', 'Belong'],
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
    ask: 'If this direction feels right, the next step is approval to refine the Skin Brief and move toward build — with your brand on these concepts.',
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
    `## ${pack.consultant.headline}`,
    '',
    pack.consultant.guideIntro,
    '',
    ...pack.consultant.findings.flatMap((f) => [
      `### ${f.title}`,
      '',
      `**What we see:** ${f.observation}`,
      `**Why it matters:** ${f.whyItMatters}`,
      `**Recommendation:** ${f.recommendation}`,
      `**Evidence:** ${f.evidence}`,
      '',
    ]),
    '## Opportunities (plain English)',
    '',
    ...pack.consultant.opportunities.flatMap((o) => [
      `### ${o.title}`,
      '',
      o.plainEnglish,
      '',
      `**What changes:** ${o.whatChanges}`,
      `**Impact:** ${o.impact}`,
      `**Evidence:** ${o.evidence}`,
      '',
    ]),
    '## Custom product concepts (see HTML email for images)',
    '',
    '1. Website / landing',
    '2. Ops / client portal',
    '3. Member home',
    '',
    '## The ask',
    '',
    pack.ask,
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n');
}

/** HTML for email body + printable sit-down preview. */
export function renderFactoryConceptPackEmailHtml(
  pack: FactoryConceptPack,
  escHtml: (s: string) => string,
  options?: { inlineSamples?: boolean },
): string {
  const s = pack.scorecard;
  const heroForSignal =
    pack.heroImageUrl && !pack.heroImageUrl.startsWith('cid:concept-')
      ? pack.heroImageUrl
      : undefined;
  const productMockups = renderConceptSampleMockups({
    clientName: pack.clientName,
    heroImageUrl: heroForSignal,
    useCid: Boolean(options?.inlineSamples),
    escHtml,
  });

  const findingBlocks = pack.consultant.findings
    .map(
      (f) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;background:#fff;border:1px solid #e8e4dc;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:${NAVY};">${escHtml(f.title)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#333;line-height:1.55;"><strong>What we see:</strong> ${escHtml(f.observation)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#333;line-height:1.55;"><strong>Why it matters:</strong> ${escHtml(f.whyItMatters)}</p>
          <p style="margin:0 0 6px;font-size:13px;color:#333;line-height:1.55;"><strong>Recommendation:</strong> ${escHtml(f.recommendation)}</p>
          <p style="margin:0;font-size:12px;color:#777;line-height:1.5;"><strong>Evidence:</strong> ${escHtml(f.evidence)}</p>
        </td></tr>
      </table>`,
    )
    .join('');

  const opportunityBlocks = pack.consultant.opportunities
    .map(
      (o) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#fff;border-left:4px solid ${GOLD};">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:${NAVY};">${escHtml(o.title)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#333;line-height:1.55;">${escHtml(o.plainEnglish)}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#444;"><strong>What changes:</strong> ${escHtml(o.whatChanges)}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#444;"><strong>Impact:</strong> ${escHtml(o.impact)}</p>
          <p style="margin:0;font-size:12px;color:#777;"><strong>Evidence:</strong> ${escHtml(o.evidence)}</p>
        </td></tr>
      </table>`,
    )
    .join('');

  return `
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${escHtml(pack.label)} · Consultant briefing</p>
    <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:${NAVY};">${escHtml(pack.clientName)}</h1>
    <p style="margin:0 0 8px;font-size:16px;color:#1A1A2E;line-height:1.6;">${escHtml(pack.coverLine)}</p>
    <p style="margin:0 0 18px;font-size:13px;color:#555;line-height:1.55;">${escHtml(pack.consultant.guideIntro)}</p>
    <p style="margin:0 0 18px;font-size:12px;color:#888;">Project ${escHtml(pack.projectId)}${pack.sourceUrl ? ` · ${escHtml(pack.sourceUrl)}` : ''}</p>

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

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${NAVY};">${escHtml(pack.consultant.headline)}</p>
    ${findingBlocks}

    <p style="margin:18px 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${NAVY};">Opportunities — in plain English</p>
    ${opportunityBlocks}

    <p style="margin:22px 0 12px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${NAVY};">Custom product concepts</p>
    ${productMockups}

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
  const body = renderFactoryConceptPackEmailHtml(pack, esc, { inlineSamples: false });
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
