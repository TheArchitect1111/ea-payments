/**
 * Sync Stripe subscription state → Airtable org billing fields + module entitlements.
 */

import type Stripe from 'stripe';
import {
  listEntitlementsForOrg,
  upsertEntitlement,
  type EntitlementStatus,
} from '@/lib/entitlements';
import {
  findOrganizationByPortalSlug,
  findOrganizationByStripeCustomerId,
  getOrganizationById,
  updateOrganizationBilling,
} from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { emitPulseEvent } from '@/lib/pulse-bus';
import {
  getSubscriptionPlan,
  subscriptionIdFromInvoice,
  subscriptionStatusIsActive,
  type SubscriptionPlanId,
} from '@/lib/subscription-catalog';
import type { ModuleId } from '@/lib/modules/registry';
import { findPortalClientByEmail } from '@/lib/airtable';

export type SubscriptionContext = {
  organizationId: string;
  portalSlug?: string;
  planId: SubscriptionPlanId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
};

export async function resolveOrganizationIdForSubscription(input: {
  organizationId?: string;
  portalSlug?: string;
  email?: string;
  stripeCustomerId?: string;
}): Promise<string | null> {
  if (input.organizationId && !input.organizationId.startsWith('org_')) {
    return input.organizationId;
  }

  if (input.stripeCustomerId) {
    const org = await findOrganizationByStripeCustomerId(input.stripeCustomerId);
    if (org) return org.id;
  }

  if (input.portalSlug) {
    const org = await findOrganizationByPortalSlug(input.portalSlug);
    if (org) return org.id;
  }

  if (input.email) {
    const client = await findPortalClientByEmail(input.email);
    if (client.ok && client.slug) {
      const org = await findOrganizationByPortalSlug(client.slug);
      if (org) return org.id;
    }
  }

  return null;
}

export async function applySubscriptionEntitlements(
  organizationId: string,
  planId: SubscriptionPlanId,
  subscriptionStatus: string,
): Promise<void> {
  if (organizationId.startsWith('org_')) return;

  const plan = getSubscriptionPlan(planId);
  if (!plan) return;

  const active = subscriptionStatusIsActive(subscriptionStatus);
  const entitlementStatus: EntitlementStatus =
    subscriptionStatus === 'trialing' ? 'trial' : active ? 'active' : 'suspended';

  for (const moduleId of plan.moduleIds) {
    await upsertEntitlement({
      organizationId,
      moduleId,
      status: entitlementStatus,
      source: 'subscription',
    });
  }

  if (!active) {
    await suspendSubscriptionOnlyModules(organizationId, plan.moduleIds);
  }
}

async function suspendSubscriptionOnlyModules(
  organizationId: string,
  planModuleIds: ModuleId[],
): Promise<void> {
  const existing = await listEntitlementsForOrg(organizationId);
  const planSet = new Set(planModuleIds);

  for (const row of existing) {
    if (row.source === 'subscription' && planSet.has(row.moduleId)) {
      await upsertEntitlement({
        organizationId,
        moduleId: row.moduleId,
        status: 'suspended',
        source: 'subscription',
      });
    }
  }
}

export async function suspendAllSubscriptionEntitlements(
  organizationId: string,
): Promise<void> {
  if (organizationId.startsWith('org_')) return;

  const existing = await listEntitlementsForOrg(organizationId);
  await Promise.all(
    existing
      .filter((row) => row.source === 'subscription')
      .map((row) =>
        upsertEntitlement({
          organizationId,
          moduleId: row.moduleId,
          status: 'suspended',
          source: 'subscription',
        }),
      ),
  );
}

export async function persistSubscriptionBilling(
  organizationId: string,
  input: {
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: SubscriptionPlanId;
    status: string;
  },
): Promise<void> {
  if (organizationId.startsWith('org_')) return;

  await updateOrganizationBilling(organizationId, {
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    subscriptionPlanId: input.planId,
    subscriptionStatus: input.status,
  });
}

export async function handleSubscriptionLifecycle(
  subscription: Stripe.Subscription,
  eventType: string,
): Promise<void> {
  const meta = subscription.metadata ?? {};
  const planId = (meta.planId ?? meta.subscriptionPlanId) as SubscriptionPlanId;
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? '';

  const organizationId = await resolveOrganizationIdForSubscription({
    organizationId: meta.organizationId,
    portalSlug: meta.portalSlug,
    email: meta.clientEmail,
    stripeCustomerId: customerId,
  });

  if (!organizationId || !planId || !getSubscriptionPlan(planId)) {
    console.error('Subscription lifecycle: missing org or plan', {
      eventType,
      subscriptionId: subscription.id,
      organizationId,
      planId,
    });
    return;
  }

  await persistSubscriptionBilling(organizationId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    planId,
    status: subscription.status,
  });

  await applySubscriptionEntitlements(organizationId, planId, subscription.status);

  const org = await getOrganizationById(organizationId);
  const portalSlug = org?.portalSlug ?? meta.portalSlug;

  if (subscription.status === 'active' || subscription.status === 'trialing') {
    if (portalSlug) {
      const plan = getSubscriptionPlan(planId)!;
      await ensurePackageEntitlements({
        orgId: organizationId,
        packagePurchased: plan.airtablePackageName,
        slug: portalSlug,
      });
    }
  }

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await suspendAllSubscriptionEntitlements(organizationId);
  }

  const pulseType =
    subscription.status === 'active'
      ? 'subscription.active'
      : subscription.status === 'trialing'
        ? 'subscription.trialing'
        : subscription.status === 'canceled'
          ? 'subscription.canceled'
          : subscription.status === 'unpaid'
            ? 'subscription.unpaid'
            : subscription.status === 'past_due'
              ? 'subscription.past_due'
              : 'subscription.canceled';

  await emitPulseEvent({
    product: 'ea-platform',
    type: pulseType,
    title: `Subscription ${subscription.status} — ${planId}`,
    detail: organizationId,
    priority: subscription.status === 'active' ? 'low' : 'high',
    href: portalSlug ? `/portal/${portalSlug}` : '/admin/dashboard',
    tenantId: portalSlug,
    metadata: {
      stripeSubscriptionId: subscription.id,
      planId,
      eventType,
    },
  });
}

export async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = subscriptionIdFromInvoice(invoice);

  if (!subscriptionId) return;

  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';

  const organizationId = await resolveOrganizationIdForSubscription({
    stripeCustomerId: customerId,
  });

  if (!organizationId) return;

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'subscription.invoice.paid',
    title: `Invoice paid — ${organizationId}`,
    detail: invoice.id,
    priority: 'low',
    href: '/admin/dashboard',
    metadata: { invoiceId: invoice.id, subscriptionId },
  });
}
