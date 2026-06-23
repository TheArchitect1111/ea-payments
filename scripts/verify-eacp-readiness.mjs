#!/usr/bin/env node

const args = new Set(process.argv.slice(2));
const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
const baseUrl = (baseArg?.slice('--base='.length) || process.env.EACP_VERIFY_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const runMutations = args.has('--mutate') || process.env.EACP_VERIFY_RUN_MUTATIONS === 'true';

const results = [];
let launchId = '';

function record(area, status, detail) {
  results.push({ area, status, detail });
}

function envPresent(...names) {
  return names.some((name) => Boolean(process.env[name]));
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.EACP_VERIFY_TIMEOUT_MS || 15000));
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { res, body };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkEndpoint(path, area) {
  try {
    const { res } = await request(path);
    record(area, res.ok ? 'PASS' : 'FAIL', `${path} returned HTTP ${res.status}.`);
  } catch (error) {
    record(area, 'FAIL', `${path} could not be reached: ${error.message}`);
  }
}

async function run() {
  record(
    'Airtable API credential',
    envPresent('AIRTABLE_API_KEY', 'AIRTABLE_PAT') ? 'PASS' : 'WARNING',
    envPresent('AIRTABLE_API_KEY', 'AIRTABLE_PAT')
      ? 'Airtable credential is present in this runtime.'
      : 'Airtable credential is not present in this runtime. Check Vercel env separately for production.',
  );
  record('Airtable table', process.env.EACP_AIRTABLE_TABLE ? 'PASS' : 'WARNING', process.env.EACP_AIRTABLE_TABLE ? 'EACP_AIRTABLE_TABLE is set.' : 'EACP_AIRTABLE_TABLE is not set in this runtime.');
  record('Airtable key field', process.env.EACP_AIRTABLE_KEY_FIELD ? 'PASS' : 'WARNING', process.env.EACP_AIRTABLE_KEY_FIELD ? 'EACP_AIRTABLE_KEY_FIELD is set.' : 'EACP_AIRTABLE_KEY_FIELD is not set; code defaults to Key.');
  record('Airtable payload field', process.env.EACP_AIRTABLE_PAYLOAD_FIELD ? 'PASS' : 'WARNING', process.env.EACP_AIRTABLE_PAYLOAD_FIELD ? 'EACP_AIRTABLE_PAYLOAD_FIELD is set.' : 'EACP_AIRTABLE_PAYLOAD_FIELD is not set; code defaults to Payload.');

  await checkEndpoint('/api/ea-factory/launch-status', 'Launch status endpoint');
  await checkEndpoint('/api/ea-factory/launch', 'Launch list endpoint');

  if (!runMutations) {
    record('Mutation verification', 'WARNING', 'Skipped launch creation and lifecycle checks. Re-run with --mutate for full readiness verification.');
    return;
  }

  try {
    const create = await request('/api/ea-factory/launch', {
      method: 'POST',
      body: JSON.stringify({
        command: 'EACP Client: EACP Verification Harness Goal: Production Hardening Deliverable: Website + Portal + Learning Hub Notes: Verify launch persistence, approval, lifecycle, audit, exports, and deployment package generation.',
      }),
    });
    if (!create.res.ok || !create.body?.launch?.id) {
      record('Launch creation', 'FAIL', `Launch creation returned HTTP ${create.res.status}: ${JSON.stringify(create.body)}`);
      return;
    }
    launchId = create.body.launch.id;
    record('Launch creation', 'PASS', `Created ${launchId}.`);

    const firstRepo = create.body.launch.recommendedRepos?.[0];
    if (firstRepo) {
      const repoReview = await request(`/api/ea-factory/launch/${launchId}/repos`, {
        method: 'POST',
        body: JSON.stringify({
          reviewerName: 'EACP Verification',
          repos: [{ id: firstRepo.id, reviewStatus: 'approved', requirement: 'required', reviewerNotes: 'Verification-approved repo.' }],
        }),
      });
      record('Repo review actions', repoReview.res.ok ? 'PASS' : 'FAIL', `Repo review returned HTTP ${repoReview.res.status}.`);
    } else {
      record('Repo review actions', 'WARNING', 'Launch returned no repository recommendations to review.');
    }

    const approval = await request(`/api/ea-factory/launch/${launchId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'approved', reviewerName: 'EACP Verification', comments: 'Verification approval.' }),
    });
    record('Approval actions', approval.res.ok ? 'PASS' : 'FAIL', `Approval returned HTTP ${approval.res.status}.`);
    if (approval.body?.launch?.status === 'ready-for-deployment') {
      record('Lifecycle integrity', 'FAIL', 'Approval skipped directly to ready-for-deployment.');
    } else {
      record('Lifecycle integrity', approval.body?.launch?.status === 'approved' ? 'PASS' : 'WARNING', `Post-approval status is ${approval.body?.launch?.status || 'unknown'}.`);
    }

    const startBuild = await request(`/api/ea-factory/launch/${launchId}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ action: 'start-build', actor: 'EACP Verification' }),
    });
    record('Build start', startBuild.res.ok ? 'PASS' : 'FAIL', `Start build returned HTTP ${startBuild.res.status}.`);

    const completeBuild = await request(`/api/ea-factory/launch/${launchId}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ action: 'complete-build', actor: 'EACP Verification' }),
    });
    record('Build completion', completeBuild.res.ok ? 'PASS' : 'FAIL', `Complete build returned HTTP ${completeBuild.res.status}.`);
    record(
      'Deployment package generation',
      completeBuild.body?.launch?.deploymentPackage ? 'PASS' : 'FAIL',
      completeBuild.body?.launch?.deploymentPackage ? 'Deployment package was created after build completion.' : 'No deployment package found after build completion.',
    );

    const deploy = await request(`/api/ea-factory/launch/${launchId}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ action: 'deploy', actor: 'EACP Verification' }),
    });
    record('Deploy transition', deploy.res.ok ? 'PASS' : 'FAIL', `Deploy returned HTTP ${deploy.res.status}.`);

    for (const type of ['json', 'markdown', 'codex']) {
      const exported = await request(`/api/ea-factory/launch/${launchId}/export?type=${type}`);
      record(`Export ${type}`, exported.res.ok ? 'PASS' : 'FAIL', `Export ${type} returned HTTP ${exported.res.status}.`);
    }

    const auditTypes = deploy.body?.launch?.auditTrail?.map((event) => event.type) || [];
    const requiredAudit = ['launch-created', 'approval-requested', 'approved', 'codex-handoff-created', 'build-started', 'build-completed', 'deployment-package-generated', 'deployed'];
    const missingAudit = requiredAudit.filter((type) => !auditTypes.includes(type));
    record('Audit trail creation', missingAudit.length === 0 ? 'PASS' : 'FAIL', missingAudit.length === 0 ? 'Required audit events were present.' : `Missing audit events: ${missingAudit.join(', ')}.`);
  } catch (error) {
    record('Verification execution', 'FAIL', error.message);
  }
}

await run();

const score = Math.round((results.filter((item) => item.status === 'PASS').length / results.length) * 100);
const classification = score >= 95 ? 'Production Ready' : score >= 80 ? 'Launch Ready' : score >= 65 ? 'Beta' : 'Prototype';

console.log(`EACP Launch Readiness Report`);
console.log(`Base URL: ${baseUrl}`);
console.log(`Mutations: ${runMutations ? 'enabled' : 'disabled'}`);
if (launchId) console.log(`Verification launch: ${launchId}`);
console.log('');

for (const item of results) {
  console.log(`${item.status.padEnd(7)} ${item.area} - ${item.detail}`);
}

console.log('');
console.log(`Readiness score: ${score}/100`);
console.log(`Classification: ${classification}`);

if (results.some((item) => item.status === 'FAIL')) {
  process.exitCode = 1;
}
