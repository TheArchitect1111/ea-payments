import { mkdir, writeFile } from 'node:fs/promises';
import { projectStatusMarkdown, runEaProjectStatusChecks } from '../lib/ea-project-status-monitor.mjs';

const report = await runEaProjectStatusChecks();
const markdown = projectStatusMarkdown(report);
await mkdir('artifacts/project-status', { recursive: true });
await writeFile('artifacts/project-status/latest.json', `${JSON.stringify(report, null, 2)}\n`);
await writeFile('artifacts/project-status/latest.md', markdown);
process.stdout.write(markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, markdown, { flag: 'a' });
}

if (report.totals.critical > 0 && process.env.EA_STATUS_FAIL_ON_CRITICAL === 'true') {
  process.exitCode = 1;
}
