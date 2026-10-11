import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { sendAuthEmail } from '@/lib/ea-auth-email';
import { payAmandaBrick, AMANDA_BRICK_MODULES, type BrickTenant } from './index';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { activeModuleIdsFromEntitlements, listEntitlementsForOrg } from '@/lib/entitlements';

export async function fulfillPortableAmandaPayment(tenant: BrickTenant, registrationId: string, reference: string) {
  const install = await loadTenantInstall(tenant.organizationId);
  const enabled = activeModuleIdsFromEntitlements(await listEntitlementsForOrg(tenant.organizationId));
  if (install?.state !== 'installed' || install.portalSlug !== tenant.portalSlug || !install.brickIds.includes('amanda') ||
      AMANDA_BRICK_MODULES.some(id => !enabled.has(id))) throw new Error('Enrollment installation unavailable');
  return payAmandaBrick(tenant, registrationId, reference, {
    verify: async id => {
      const payment = await getStripe().paymentIntents.retrieve(id);
      return { reference: payment.id, organizationId: payment.metadata.organizationId,
        registrationId: payment.metadata.registrationId, offerId: payment.metadata.offerId,
        amount: payment.amount_received, currency: payment.currency, paid: payment.status === 'succeeded' };
    },
    confirm: async message => {
      const sent = await sendAuthEmail({ to: message.to, subject: message.subject,
        title: 'Registration confirmation', bodyHtml: message.html, text: 'Your registration payment is confirmed.' });
      if (!sent.ok) throw new Error('Confirmation delivery failed');
    },
  });
}
/** Called only after the existing Stripe webhook signature verification. */
export async function fulfillPortableAmandaSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.portableBrick !== 'amanda') return false;
  if (session.payment_status !== 'paid') throw new Error('Stripe has not confirmed payment');
  const reference = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!reference) throw new Error('Stripe payment reference missing');
  await fulfillPortableAmandaPayment({ organizationId: session.metadata.organizationId, portalSlug: session.metadata.portalSlug },
    session.metadata.registrationId, reference);
  return true;
}
