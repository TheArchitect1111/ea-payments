/**
 * Launch Command Center — unified readiness report + score.
 *
 * Usage:
 *   node scripts/launch-command-center.mjs
 *   node scripts/launch-command-center.mjs https://ea-payments.vercel.app
 *   LAUNCH_BASE_URL=https://www.efficiencyarchitects.online npm run launch:report
 */
const BASE = process.argv[2] || process.env.LAUNCH_BASE_URL || 'https://ea-payments.vercel.app';

const STATUS_ICON = {
  complete: '✓',
  missing: '✗',
  needs_credentials: '🔑',
  needs_human_action: '👤',
};

function pad(s, n) {
  return String(s).padEnd(n);
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  EA LAUNCH COMMAND CENTER');
  console.log('  Base:', BASE);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  let report;
  try {
    const res = await fetch(`${BASE}/api/health/command-center`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) {
      console.error('FAIL', res.status, await res.text());
      process.exit(1);
    }
    report = await res.json();
  } catch (err) {
    console.error('Could not reach command center:', err.message);
    console.error('Is the app deployed? Try: npm run dev (local) or check BASE URL.');
    process.exit(1);
  }

  const score = report.readinessScore ?? 0;
  const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));

  console.log(`  LAUNCH READINESS SCORE: ${score}/100`);
  console.log(`  [${bar}]`);
  console.log(`  Platform status: ${report.status}`);
  console.log(`  Generated: ${report.generatedAt}`);
  console.log('');
  console.log('  Summary:');
  console.log(`    Complete:           ${report.summary?.complete ?? 0}`);
  console.log(`    Missing:            ${report.summary?.missing ?? 0}`);
  console.log(`    Needs credentials:  ${report.summary?.needsCredentials ?? 0}`);
  console.log(`    Needs human action: ${report.summary?.needsHumanAction ?? 0}`);
  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  CHECKLIST');
  console.log('───────────────────────────────────────────────────────────');

  const byCategory = new Map();
  for (const item of report.items ?? []) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  for (const [category, items] of byCategory) {
    console.log('');
    console.log(`  ## ${category}`);
    for (const item of items) {
      const icon = STATUS_ICON[item.status] ?? '?';
      const pts =
        item.maxScore > 0 ? ` (${item.score}/${item.maxScore})` : item.status === 'complete' ? ' (n/a)' : '';
      console.log(`  ${icon} ${item.name}${pts}`);
      console.log(`      Automation: ${item.automation}`);
      console.log(`      Status: ${item.status}`);
      console.log(`      ${item.message}`);
      if (item.fix) console.log(`      Fix: ${item.fix}`);
      if (item.verify) console.log(`      Verify: ${item.verify}`);
    }
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  AUTOMATION SUMMARY');
  console.log('───────────────────────────────────────────────────────────');

  const auto = { fully_automated: 0, partially_automated: 0, manual_only: 0 };
  for (const item of report.items ?? []) {
    auto[item.automation] = (auto[item.automation] ?? 0) + 1;
  }
  console.log(`  Fully automated checks:     ${auto.fully_automated}`);
  console.log(`  Partially automated:      ${auto.partially_automated}`);
  console.log(`  Manual only:              ${auto.manual_only}`);
  console.log('');
  console.log('  Links:');
  console.log(`    Command center API: ${report.links?.commandCenter}`);
  console.log(`    Health launch:      ${report.links?.healthLaunch}`);
  console.log(`    Tester hub:         ${report.links?.start}`);
  console.log('');

  if (report.status === 'full_launch_ready') {
    console.log('  PASS — full_launch_ready. Run one live checkout to confirm.');
    process.exit(0);
  }

  const blockers = (report.items ?? []).filter(
    (i) => i.maxScore > 0 && i.status !== 'complete' && i.score < i.maxScore,
  );
  if (blockers.length) {
    console.log('  Top blockers (by points):');
    blockers
      .sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score))
      .slice(0, 5)
      .forEach((i) => {
        console.log(`    - ${i.name} (${i.maxScore - i.score} pts remaining)`);
      });
  }
  console.log('');
  process.exit(score >= 80 ? 0 : 1);
}

main();
