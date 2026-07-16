/**
 * Magnifi printable HTML — browser Print → Save as PDF.
 * Mirrors Connect print-pack; no binary PDF microservice.
 */
import { parseBlueprintSummary } from '@/lib/blueprint-summary';
import type { CaptureRecord } from '@/lib/capture-records';
import { NAVY, GOLD, CREAM } from '@/lib/design-system';
import { parseOpportunityPayload } from '@/lib/opportunity-experience';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sectionBlock(title: string, body: string): string {
  if (!body.trim()) return '';
  return `
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(body).replace(/\n/g, '<br />')}</p>
    </section>`;
}

export function buildMagnifiPrintPackHtml(capture: CaptureRecord): string {
  const payload = parseOpportunityPayload(capture);
  const parsed = parseBlueprintSummary(capture.blueprintSummary || capture.analysisSummary);
  const title = capture.businessName || capture.title || 'Magnifi Opportunity Report';
  const magnifi = payload?.magnifi;

  const scoreRows = payload?.analysis?.scores
    ? Object.entries(payload.analysis.scores)
        .map(
          ([key, value]) =>
            `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(String(value))}</td></tr>`,
        )
        .join('')
    : '';

  const blueprintSections =
    parsed.sections.length > 0
      ? parsed.sections
          .map(
            (section) => `
      <section class="block">
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.content).replace(/\n/g, '<br />')}</p>
      </section>`,
          )
          .join('')
      : '';

  const roadmap =
    parsed.roadmap.length > 0
      ? `<section class="block">
        <h2>Roadmap</h2>
        <ul>${parsed.roadmap
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.phase)}</strong> — ${escapeHtml(item.focus)}</li>`,
          )
          .join('')}</ul>
      </section>`
      : '';

  const narrative = magnifi
    ? [
        sectionBlock('Current state', magnifi.currentState),
        sectionBlock('Opportunity analysis', magnifi.opportunityAnalysis),
        sectionBlock('Future state', magnifi.futureState),
        sectionBlock(
          'Recommended improvements',
          magnifi.recommendedImprovements.join('\n'),
        ),
        sectionBlock('Quick wins', magnifi.quickWins.join('\n')),
        sectionBlock('Consider the possibilities', magnifi.considerThePossibilities),
      ].join('')
    : '';

  const fallback =
    !narrative && !blueprintSections
      ? sectionBlock(
          'Summary',
          capture.analysisSummary?.slice(0, 4000) ||
            'Summary is still being prepared for this capture.',
        )
      : '';

  const lowTrustNote =
    typeof capture.trustConfidence === 'number' && capture.trustConfidence < 50
      ? `<p class="notice">Limited page signal (confidence ${capture.trustConfidence}/100). Prefer a deeper URL or screenshot upload for a richer Magnifi.</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — Magnifi</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; margin: 0; padding: 28px; color: ${NAVY}; background: ${CREAM}; }
    header { border-bottom: 3px solid ${GOLD}; padding-bottom: 16px; margin-bottom: 24px; }
    .eyebrow { margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${GOLD}; font-weight: 700; }
    h1 { margin: 0; font-size: 32px; line-height: 1.15; }
    .sub { margin: 10px 0 0; font-family: Arial, sans-serif; font-size: 13px; color: #64748b; }
    .notice { font-family: Arial, sans-serif; font-size: 13px; background: #fff7ed; border: 1px solid #fdba74; padding: 10px 12px; margin: 0 0 20px; }
    .block { background: #fff; border: 1px solid #e2e8f0; padding: 16px 18px; margin-bottom: 14px; page-break-inside: avoid; }
    .block h2 { margin: 0 0 8px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${GOLD}; }
    .block p, .block li { margin: 0; font-size: 14px; line-height: 1.55; color: #334155; }
    .block ul { margin: 0; padding-left: 18px; }
    table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; margin-bottom: 14px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; background: #fff; }
    th { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: ${GOLD}; }
    .actions { margin-top: 20px; font-family: Arial, sans-serif; font-size: 12px; }
    @media print {
      body { padding: 12px; background: #fff; }
      .no-print { display: none; }
      .block { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <p class="eyebrow">Magnifi™ Opportunity Report</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="sub">Capture ${escapeHtml(capture.id)}${capture.sourceUrl ? ` · ${escapeHtml(capture.sourceUrl)}` : ''}</p>
    <p class="sub no-print">Print this page or choose Save as PDF in your browser.</p>
  </header>
  ${lowTrustNote}
  ${
    scoreRows
      ? `<table><thead><tr><th>Dimension</th><th>Score</th></tr></thead><tbody>${scoreRows}</tbody></table>`
      : ''
  }
  ${narrative}
  ${blueprintSections}
  ${roadmap}
  ${fallback}
  <p class="actions no-print">
    <a href="/magnifi/${escapeHtml(capture.id)}">Open cinematic Magnifi</a>
    ·
    <a href="/magnifi/${escapeHtml(capture.id)}?classic=1">Classic report</a>
  </p>
  <script>if (new URLSearchParams(location.search).get('autoprint') === '1') window.print();</script>
</body>
</html>`;
}
