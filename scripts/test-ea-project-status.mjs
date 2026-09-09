import assert from 'node:assert/strict';
import { projectStatusMarkdown, runEaProjectStatusChecks } from '../lib/ea-project-status-monitor.mjs';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  const value = String(url);
  if (value.includes('/amanda-catherine/amanda-catherine-') && value.endsWith('.webp')) {
    return new Response(new Uint8Array(60000), { status: 200, headers: { 'content-type': 'image/webp' } });
  }
  if (value.includes('api.github.com/repos/')) {
    return new Response(JSON.stringify({ default_branch: 'main', archived: false, visibility: 'private', updated_at: '2026-08-15T00:00:00Z' }), { status: 200 });
  }
  if (value.includes('api.vercel.com/v9/projects/')) {
    return new Response(JSON.stringify({ id: 'prj_test', targets: { production: { id: 'dpl_test', readyState: 'READY', url: 'example.vercel.app' } } }), { status: 200 });
  }
  const markerByUrl = {
    'https://efficiencyarchitects.online': 'Efficiency Architects',
    'https://efficiencyarchitects.online/amplifi': 'Amplifi',
    'https://simplifi.ai': 'Simplifi',
    'https://ea-wt-home.vercel.app': 'Efficiency Architects Executive',
    'https://next-steps-pro.vercel.app': 'Next Steps Athlete',
    'https://etfm-assessment.vercel.app': 'ETFM',
    'https://ea-magnifi.vercel.app': 'Magnifi',
    'https://ea-training-transformation.vercel.app': 'Training Transformation',
    'https://ea-communications-chassis.vercel.app': 'Communication',
    'https://form-to-finish-executive-review.vercel.app': 'Basketball Form to Finish',
    'https://amandacatherine.ca': 'Amanda Catherine Return to alignment Restore Learn Create',
    'https://www.cprglobalsports.com': 'CPR Global Prospects',
    'https://mississaugamagic.com': 'Mississauga Magic',
    'https://brother-hub.vercel.app': 'BrotherHub Gastonia',
    'https://bobrumball-experience-lab.vercel.app': 'Bob Rumball'
  };
  return new Response(`<html><title>${markerByUrl[value] ?? 'EA'}</title></html>`, { status: 200 });
};

try {
  const report = await runEaProjectStatusChecks({ githubToken: 'test', vercelToken: 'test', vercelTeamId: 'team_test' });
  assert.equal(report.projects.length, 17);
  assert.equal(report.totals.critical, 0);
  assert.equal(report.projects.find((project) => project.id === 'AMANDA').checks.publicPage.status, 'healthy');
  assert.equal(report.projects.find((project) => project.id === 'EA-IP').checks.vercel.status, 'not_applicable');
  assert.equal(report.projects.find((project) => project.id === 'MBI').overall, 'attention');
  assert.match(projectStatusMarkdown(report), /EA Active Project Status/);
  console.log('EA project status contracts: PASS');
} finally {
  globalThis.fetch = originalFetch;
}
