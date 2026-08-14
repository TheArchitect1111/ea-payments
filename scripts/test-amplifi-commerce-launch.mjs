import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const offer = read('vendor/payments-contract/src/amplifi-offers.ts');
const pricing = read('app/amplifi/pricing/page.tsx');
const register = read('app/amplifi/register/AmplifiRegistrationForm.tsx');
const checkout = read('app/api/checkout/subscription/route.ts');
const webhook = read('app/api/webhooks/stripe/route.ts');
const success = read('app/checkout/success/CheckoutSuccessClient.tsx');

assert.match(offer, /id: 'amplifi_social'/);
assert.match(offer, /priceCents: 2900/);
assert.match(offer, /allowInlineStripePrice: true/);
assert.match(offer, /id: 'amplifi_complete'[\s\S]*allowInlineStripePrice: false/);
assert.match(pricing, /Start with Amplifi Social/);
assert.match(pricing, /href="\/amplifi\/register\?plan=amplifi_social"/);
assert.match(register, /planId: 'amplifi_social'/);
assert.match(register, /\/api\/checkout\/subscription/);
assert.match(checkout, /mode: 'subscription'/);
assert.match(checkout, /success_url:.*type=subscription/);
assert.match(webhook, /handleSubscriptionCheckoutCompleted/);
assert.match(webhook, /createPortalAccess/);
assert.match(webhook, /ensureOrganizationForPortal/);
assert.match(webhook, /applySubscriptionEntitlements/);
assert.match(webhook, /Amplifi by Efficiency Architects/);
assert.match(webhook, /\/amplifi\/onboarding/);
assert.match(success, /Set Up Amplifi/);

console.log('Amplifi Phase 1 commerce launch contract passed.');
