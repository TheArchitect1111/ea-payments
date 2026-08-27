import { readFile, writeFile } from 'node:fs/promises';

const path = 'app/api/webhooks/stripe/route.ts';
let source = await readFile(path, 'utf8');

const importAnchor = "import { CANONICAL_CTP_INTAKE_URL } from '@/lib/platform-urls';\n";
const imports = `${importAnchor}import { fulfillAmandaCheckout, isAmandaCheckoutSession } from '@/lib/amanda-catherine/payment-fulfillment';\nimport { notifyAmandaOwnerOfEnrollment } from '@/lib/amanda-catherine/owner-payment-notification';\n`;
if (!source.includes("isAmandaCheckoutSession } from '@/lib/amanda-catherine/payment-fulfillment'")) {
  if (!source.includes(importAnchor)) throw new Error('Webhook import anchor not found');
  source = source.replace(importAnchor, imports);
}

const handlerAnchor = "async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {\n  const meta = session.metadata ?? {};\n\n";
const amandaBranch = `${handlerAnchor}  if (isAmandaCheckoutSession(session)) {\n    const result = await fulfillAmandaCheckout(session, 'webhook');\n    if (!result.ok) {\n      console.error('[amanda-payment] webhook fulfillment failed', session.id, result.error);\n      return;\n    }\n    const ownerNotice = await notifyAmandaOwnerOfEnrollment(session);\n    if (!ownerNotice.ok) {\n      console.error('[amanda-payment] owner notification failed', session.id, ownerNotice.error);\n    }\n    return;\n  }\n\n`;
if (!source.includes("fulfillAmandaCheckout(session, 'webhook')")) {
  if (!source.includes(handlerAnchor)) throw new Error('Webhook handler anchor not found');
  source = source.replace(handlerAnchor, amandaBranch);
}

await writeFile(path, source);
console.log('Amanda Stripe webhook branch applied.');
