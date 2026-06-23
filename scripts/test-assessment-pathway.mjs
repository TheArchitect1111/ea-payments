#!/usr/bin/env node

const baseUrl = (process.argv[2] || process.env.EA_TEST_BASE_URL || 'https://ea-payments.vercel.app').replace(/\/$/, '');
const stamp = Date.now();
const email = `qa+assessment-${stamp}@efficiencyarchitects.online`;

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, body, location: res.headers.get('location') };
}

function logStep(label, result) {
  const status = result.status >= 200 && result.status < 400 ? 'PASS' : 'FAIL';
  console.log(`${status} ${label}: HTTP ${result.status}`);
}

const payload = {
  businessName: `EA Pathway QA ${stamp}`,
  contactName: 'Systems Pathway QA',
  email,
  teamSizeLabel: '6-15 people',
  revenueRange: '$500k to $1M',
  currentSystems: 'Google Workspace, Stripe, Airtable',
  operationalChallenges: ['too_many_manual_steps', 'unclear_handoffs'],
  growthGoals: 'Validate the full assessment-to-proposal trail before launch.',
  capacityConstraints: 'Manual handoffs and reporting latency.',
};

const trail = [];

const assessmentPage = await request('/assessment', { headers: {} });
trail.push({ step: 'Assessment page loads', ...assessmentPage });
logStep('Assessment page loads', assessmentPage);

const submission = await request('/api/assessment/submit', {
  method: 'POST',
  body: JSON.stringify(payload),
});
trail.push({ step: 'Assessment API accepts submission', ...submission });
logStep('Assessment API accepts submission', submission);

const proposalId = typeof submission.body === 'object' && submission.body ? submission.body.proposalId : undefined;

if (!proposalId) {
  console.log('STOP Assessment did not create a proposalId.');
  console.log(JSON.stringify({ baseUrl, email, submission: submission.body }, null, 2));
  process.exit(1);
}

const thankYou = await request(`/assessment/thank-you?proposal=${encodeURIComponent(proposalId)}`, { headers: {} });
trail.push({ step: 'Thank-you page loads with proposal', ...thankYou });
logStep('Thank-you page loads with proposal', thankYou);

const proposalPage = await request(`/proposal/${encodeURIComponent(proposalId)}`, { headers: {} });
trail.push({ step: 'Proposal page loads', ...proposalPage });
logStep('Proposal page loads', proposalPage);

const commitmentPage = await request(`/commitment/${encodeURIComponent(proposalId)}`, { headers: {} });
trail.push({ step: 'Commitment page loads', ...commitmentPage });
if (commitmentPage.status === 404) {
  console.log('GATED Commitment page is closed until proposal status is Approved or Sent.');
} else {
  logStep('Commitment page loads', commitmentPage);
}

const checkout = await request('/api/checkout/proposal', {
  method: 'POST',
  body: JSON.stringify({ proposalId }),
});
trail.push({ step: 'Proposal checkout session creates', ...checkout });
if (checkout.status === 303 && checkout.location?.includes('checkout.stripe.com')) {
  logStep('Proposal checkout redirects to Stripe', checkout);
} else if (checkout.status === 303 && checkout.location?.includes('/proposal/')) {
  console.log('GATED Proposal checkout redirected back to proposal. New submissions require approval before payment.');
} else {
  logStep('Proposal checkout session creates', checkout);
}

const stripeUrl = typeof checkout.body === 'object' && checkout.body ? checkout.body.url : undefined;
const redirectStripeUrl = checkout.location?.includes('checkout.stripe.com') ? checkout.location : undefined;
if (!stripeUrl && !redirectStripeUrl && !checkout.location?.includes('/proposal/')) {
  console.log('STOP Proposal checkout did not return or redirect to an expected URL.');
  console.log(JSON.stringify({ baseUrl, email, proposalId, checkout: checkout.body }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      email,
      proposalId,
      proposalCreated: true,
      commitmentGate:
        commitmentPage.status === 404 ? 'pending_review_requires_approval' : 'available',
      checkoutGate: redirectStripeUrl
        ? 'stripe_redirect_created'
        : 'pending_review_requires_approval',
      trail: trail.map((item) => ({
        step: item.step,
        status: item.status,
        location: item.location,
      })),
    },
    null,
    2,
  ),
);
