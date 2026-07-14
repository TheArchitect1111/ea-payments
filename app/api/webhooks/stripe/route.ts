import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import {
  createOrUpdateClientRecord,
  getProposalByRecordId,
  updateProposal,
} from '@/lib/airtable';
import type { AirtablePackage, ProposalWithAssessment } from '@/lib/airtable';
import { getCatalogItem } from '@/lib/catalog';
import { buildPackageFulfillmentPlan } from '@/lib/package-fulfillment';
import { resolveCheckoutOffer } from '@/lib/platform/payments-bridge';
import { ensureOrganizationForPortal } from '@/lib/organizations';
import { ensurePackageEntitlements } from '@/lib/modules/portal-modules';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';
import { createPortalAccess } from '@/lib/portal-access';
import { createOpportunityRecord } from '@/lib/partner-network';
import { fireOnboardingWebhook } from '@/lib/make-webhooks';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { isLaunchVerificationSession } from '@/lib/launch-verification';
import { handleLaunchVerificationPayment } from '@/lib/launch-verification-flow';
import { lifecycleForPaidClient } from '@/lib/client-lifecycle';
import { getSubscriptionPlan, type SubscriptionPlanId } from '@/lib/subscription-catalog';
import {
  applySubscriptionEntitlements,
  handleInvoicePaid,
  handleSubscriptionLifecycle,
  persistSubscriptionBilling,
  resolveOrganizationIdForSubscription,
} from '@/lib/subscription-sync';
import { provisionConnectAfterCheckout } from '@/lib/connect-provision-hook';
import { provisionWebsitePortalSite } from '@/lib/provision-website-portal';

export const dynamic = 'force-dynamic';

const VALID_PACKAGES: AirtablePackage[] = [
  'Capacity Assessment',
  'Capacity Blueprint',
  'Implementation Package',
  'Simplifi',
  'Launch Verification',
];

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not set.');
    return new Response('Webhook not configured.', { status: 500 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set.');
    return new Response('Stripe not configured.', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('Webhook signature error:', msg);
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionLifecycle(
        event.data.object as Stripe.Subscription,
        event.type,
      );
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};

  if (meta.checkoutType === 'subscription' || session.mode === 'subscription') {
    await handleSubscriptionCheckoutCompleted(session);
    return;
  }

  if (isLaunchVerificationSession(meta as Record<string, string | undefined>)) {
    await handleLaunchVerificationPayment(session);
    return;
  }

  // Phase E: proposal-based payment. Branch early; Phase A logic is not run.
  if (meta.proposalId && meta.airtableRecordId) {
    await handleProposalPayment(session, meta.proposalId, meta.airtableRecordId);
    return;
  }

  // Phase A: fixed-package payment (existing logic unchanged below).
  const customerDetails = session.customer_details;

  const clientName = meta.clientName || customerDetails?.name || 'Unknown Client';

  const email = customerDetails?.email || session.customer_email || '';
  if (!email) {
    console.error('No email on checkout session:', session.id);
    return;
  }

  const packageName = meta.packageName as AirtablePackage | undefined;
  if (!packageName || !VALID_PACKAGES.includes(packageName)) {
    console.error('Invalid or missing packageName in session metadata:', session.id, packageName);
    return;
  }

  const amountPaid = (session.amount_total ?? 0) / 100;

  const paymentDate = session.created
    ? new Date(session.created * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const paymentReceivedAt = session.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();

  const stripeTransactionId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id;

  const airtableResult = await createOrUpdateClientRecord({
    clientName,
    organization: meta.organization || undefined,
    email,
    phone: meta.phone || customerDetails?.phone || undefined,
    packagePurchased: packageName,
    amountPaid,
    paymentDate,
    stripeTransactionId,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    paymentReceivedAt,
    lifecycle: lifecycleForPaidClient(packageName),
  });

  if (!airtableResult.ok) {
    console.error('Airtable write failed for session', session.id, ':', airtableResult.error);
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'onboarding.blocked',
      title: `Payment received — Airtable failed for ${clientName}`,
      detail: airtableResult.error ?? 'Client record not created',
      priority: 'critical',
      href: '/admin/dashboard',
      metadata: { stripeSessionId: session.id, email },
    });
    return;
  }

  const offerId = String(meta.commerceOfferId || meta.packageId || '');
  const checkoutOffer = offerId ? resolveCheckoutOffer(offerId) : null;
  const catalogItem = meta.packageId ? getCatalogItem(meta.packageId) : undefined;
  const fulfillment = checkoutOffer
    ? buildPackageFulfillmentPlan(checkoutOffer)
    : catalogItem
      ? buildPackageFulfillmentPlan(catalogItem)
      : {
          packageId: meta.packageId || '',
          displayName: String(meta.packageDisplayName || packageName),
          fulfillmentType: String(meta.fulfillmentType || 'implementation'),
          fulfillmentLabel: String(meta.fulfillmentLabel || 'Review payment and begin onboarding.'),
          reviewRequired: meta.reviewRequired === 'true',
          intakePath: String(meta.intakePath || '/discover'),
          adminHref: String(meta.adminHref || '/admin/master'),
          clientExpectation: 'Your project workspace is being prepared. We will confirm the path before anything goes live.',
          firstMilestone: String(meta.firstMilestone || 'Confirm project direction.'),
        };

  const portalConfig = checkoutOffer?.portalConfig ?? catalogItem?.portalConfig;
  const portalLoginFallback =
    catalogItem?.portalLoginUrl ??
    `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app'}/portal/login`;

  let tempCredentials: string | undefined;
  let portalSlug: string | undefined;
  let portalLoginUrl: string = portalLoginFallback;
  let siteUrl: string | undefined;
  const isWebsitePortalAuto = fulfillment.fulfillmentType === 'website-portal-auto';

  if (portalConfig && airtableResult.recordId) {

    try {
      const portalResult = await createPortalAccess(
        {
          clientName,
          email,
          organization: meta.organization || undefined,
          airtableRecordId: airtableResult.recordId,
        },
        portalConfig
      );

      if (portalResult.ok) {
        if (portalResult.slug) {
          portalSlug = portalResult.slug;
        }
        if (portalResult.portalLoginUrl) {
          portalLoginUrl = portalResult.portalLoginUrl;
        }
        if (portalResult.username && portalResult.tempPassword) {
          tempCredentials =
            `Your portal login credentials: Email: ${portalResult.username} | Temporary Password: ${portalResult.tempPassword}` +
            ' Log in using the button above. Contact us to update your password at any time.';
        }

        if (portalSlug && airtableResult.recordId) {
          try {
            const { orgId } = await ensureOrganizationForPortal({
              portalSlug,
              name: clientName,
              clientRecordId: airtableResult.recordId,
              organizationName: meta.organization || undefined,
            });
            await ensurePackageEntitlements({
              orgId,
              packagePurchased: offerId || packageName,
              slug: portalSlug,
            });
            await provisionConnectAfterCheckout({
              portalSlug,
              organizationName: clientName,
              ownerEmail: email,
              packagePurchased: offerId || packageName,
              connectIndustry: typeof meta.connectIndustry === 'string' ? meta.connectIndustry : null,
            });

            if (isWebsitePortalAuto) {
              const siteResult = await provisionWebsitePortalSite({
                portalSlug,
                businessName: clientName,
                organizationName: meta.organization || undefined,
                tagline: typeof meta.tagline === 'string' ? meta.tagline : undefined,
                industry: typeof meta.industry === 'string' ? meta.industry : undefined,
                email,
              });
              if (siteResult.ok && siteResult.siteUrl) {
                siteUrl = siteResult.siteUrl;
              } else {
                console.error(
                  'Website provision failed for session',
                  session.id,
                  ':',
                  siteResult.error,
                );
              }
            }
          } catch (err) {
            console.error('Entitlement sync failed for session', session.id, ':', err);
          }
        }
      } else {
        console.error('Portal access creation failed for session', session.id, ':', portalResult.error);
      }
    } catch (err) {
      console.error('Portal access creation threw for session', session.id, ':', err);
    }
  }

  const referralSource = (meta.referralSource ?? '').trim();
  if (referralSource && airtableResult.recordId) {
    try {
      const oppResult = await createOpportunityRecord({
        clientName,
        packageName: packageName as string,
        referralSource,
        organization: meta.organization || undefined,
        projectValue: amountPaid,
      });
      if (!oppResult.ok) {
        console.error('Opportunity record creation failed for session', session.id, ':', oppResult.error);
      }
    } catch (err) {
      console.error('Opportunity record creation threw for session', session.id, ':', err);
    }
  }

  const paymentMethodTypes = Array.isArray(session.payment_method_types)
    ? session.payment_method_types
    : [];

  try {
    const welcomeResult = await sendWelcomeEmail({
      clientName,
      email,
      packageName: fulfillment.displayName,
      portalLoginUrl,
      tempCredentials,
      nextSteps: siteUrl
        ? `${fulfillment.clientExpectation} Your live website: ${siteUrl}`
        : fulfillment.clientExpectation,
      siteUrl,
      readyNow: isWebsitePortalAuto && Boolean(siteUrl),
    });
    if (!welcomeResult.ok) {
      console.error('Welcome email failed for session', session.id, ':', welcomeResult.error);
    }
  } catch (err) {
    console.error('Welcome email threw for session', session.id, ':', err);
  }

  try {
    const adminResult = await sendAdminNotification({
      clientName,
      organization: meta.organization || undefined,
      email,
      packageName: fulfillment.displayName,
      amountPaid,
      paymentDate,
      paymentMethodTypes,
      stripeTransactionId,
      airtableRecordId: airtableResult.recordId,
    });
    if (!adminResult.ok) {
      console.error('Admin notification failed for session', session.id, ':', adminResult.error);
    }
  } catch (err) {
    console.error('Admin notification threw for session', session.id, ':', err);
  }

  await fireOnboardingWebhook({
    event: 'payment.received',
    clientName,
    email,
    organization: meta.organization || undefined,
    packageName,
    packageId: fulfillment.packageId,
    packageDisplayName: fulfillment.displayName,
    fulfillmentType: fulfillment.fulfillmentType,
    fulfillmentLabel: fulfillment.fulfillmentLabel,
    reviewRequired: fulfillment.reviewRequired,
    intakePath: fulfillment.intakePath,
    adminHref: fulfillment.adminHref,
    firstMilestone: fulfillment.firstMilestone,
    amountPaid,
    paymentDate,
    stripeTransactionId,
    airtableRecordId: airtableResult.recordId,
    portalSlug,
    portalLoginUrl,
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'payment.received',
    title: `Payment received — ${clientName}`,
    detail: `$${amountPaid.toFixed(2)} · ${packageName}`,
    priority: 'high',
    href: fulfillment.adminHref,
    objectId: airtableResult.recordId,
    metadata: {
      stripeSessionId: session.id,
      email,
      packageName,
      packageDisplayName: fulfillment.displayName,
      fulfillmentType: fulfillment.fulfillmentType,
      reviewRequired: fulfillment.reviewRequired,
    },
  });

  if (fulfillment.reviewRequired) {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'fulfillment.review_required',
      title: `Review required - ${fulfillment.displayName}`,
      detail: `${clientName}: ${fulfillment.fulfillmentLabel}`,
      priority: 'high',
      href: fulfillment.adminHref,
      objectId: airtableResult.recordId,
      metadata: {
        stripeSessionId: session.id,
        email,
        packageId: fulfillment.packageId,
        fulfillmentType: fulfillment.fulfillmentType,
      },
    });
  } else if (isWebsitePortalAuto) {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'fulfillment.provisioned',
      title: `Website + portal live — ${clientName}`,
      detail: siteUrl
        ? `Site ${siteUrl} · Portal ${portalLoginUrl}`
        : `Portal ${portalLoginUrl} (site provision pending)`,
      priority: 'high',
      href: siteUrl || fulfillment.adminHref,
      objectId: airtableResult.recordId,
      metadata: {
        stripeSessionId: session.id,
        email,
        packageId: fulfillment.packageId,
        fulfillmentType: fulfillment.fulfillmentType,
        portalSlug: portalSlug || '',
        siteUrl: siteUrl || '',
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Phase 3: subscription checkout + lifecycle
// ---------------------------------------------------------------------------

async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = session.metadata ?? {};
  const planId = (meta.commerceOfferId || meta.planId || '') as SubscriptionPlanId;
  const plan = getSubscriptionPlan(planId);

  if (!plan) {
    console.error('Subscription checkout: invalid planId', session.id, planId);
    return;
  }

  const customerDetails = session.customer_details;
  const clientName = meta.clientName || customerDetails?.name || 'Unknown Client';
  const email =
    meta.clientEmail || customerDetails?.email || session.customer_email || '';

  if (!email) {
    console.error('Subscription checkout: no email', session.id);
    return;
  }

  const stripeCustomerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? '';

  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? '';

  const amountPaid = (session.amount_total ?? 0) / 100;
  const paymentDate = session.created
    ? new Date(session.created * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const paymentReceivedAt = session.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();

  const airtableResult = await createOrUpdateClientRecord({
    clientName,
    organization: meta.organization || undefined,
    email,
    phone: meta.phone || customerDetails?.phone || undefined,
    packagePurchased: plan.airtablePackageName,
    amountPaid,
    paymentDate,
    stripeTransactionId: stripeSubscriptionId || session.id,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    paymentReceivedAt,
    lifecycle: lifecycleForPaidClient(plan.airtablePackageName),
  });

  if (!airtableResult.ok) {
    console.error(
      'Subscription checkout: Airtable write failed',
      session.id,
      airtableResult.error,
    );
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'onboarding.blocked',
      title: `Subscription started — Airtable failed for ${clientName}`,
      detail: airtableResult.error ?? 'Client record not created',
      priority: 'critical',
      href: '/admin/dashboard',
      metadata: { stripeSessionId: session.id, email, planId },
    });
    return;
  }

  let portalSlug: string | undefined;
  let portalLoginUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app'}/portal/login`;
  let tempCredentials: string | undefined;

  if (plan.portalConfig && airtableResult.recordId) {
    try {
      const portalResult = await createPortalAccess(
        {
          clientName,
          email,
          organization: meta.organization || undefined,
          airtableRecordId: airtableResult.recordId,
        },
        plan.portalConfig,
      );

      if (portalResult.ok) {
        portalSlug = portalResult.slug;
        if (portalResult.portalLoginUrl) portalLoginUrl = portalResult.portalLoginUrl;
        if (portalResult.username && portalResult.tempPassword) {
          tempCredentials =
            `Your portal login credentials: Email: ${portalResult.username} | Temporary Password: ${portalResult.tempPassword}` +
            ' Log in using the button above. Contact us to update your password at any time.';
        }
      }
    } catch (err) {
      console.error('Subscription checkout: portal provisioning failed', session.id, err);
    }
  }

  let organizationId: string | null = null;

  if (portalSlug && airtableResult.recordId) {
    try {
      const { orgId } = await ensureOrganizationForPortal({
        portalSlug,
        name: clientName,
        clientRecordId: airtableResult.recordId,
        organizationName: meta.organization || undefined,
      });
      organizationId = orgId;

      if (stripeCustomerId && stripeSubscriptionId && !orgId.startsWith('org_')) {
        await persistSubscriptionBilling(orgId, {
          stripeCustomerId,
          stripeSubscriptionId,
          planId,
          status: 'trialing',
        });
        await applySubscriptionEntitlements(orgId, planId, 'trialing');
      } else if (!orgId.startsWith('org_')) {
        await ensurePackageEntitlements({
          orgId,
          packagePurchased: plan.airtablePackageName,
          slug: portalSlug,
        });
        await provisionConnectAfterCheckout({
          portalSlug,
          organizationName: clientName,
          ownerEmail: email,
          packagePurchased: plan.airtablePackageName,
          connectIndustry: typeof meta.connectIndustry === 'string' ? meta.connectIndustry : null,
        });
      }
    } catch (err) {
      console.error('Subscription checkout: org/entitlement sync failed', session.id, err);
    }
  }

  const referralSource = (meta.referralSource ?? '').trim();
  if (referralSource && airtableResult.recordId) {
    try {
      await createOpportunityRecord({
        clientName,
        packageName: plan.airtablePackageName,
        referralSource,
        organization: meta.organization || undefined,
        projectValue: amountPaid,
      });
    } catch (err) {
      console.error('Subscription checkout: opportunity record failed', session.id, err);
    }
  }

  try {
    await sendWelcomeEmail({
      clientName,
      email,
      packageName: plan.displayName,
      portalLoginUrl,
      tempCredentials,
    });
  } catch (err) {
    console.error('Subscription checkout: welcome email failed', session.id, err);
  }

  try {
    await sendAdminNotification({
      clientName,
      organization: meta.organization || undefined,
      email,
      packageName: plan.displayName,
      amountPaid,
      paymentDate,
      paymentMethodTypes: session.payment_method_types ?? [],
      stripeTransactionId: stripeSubscriptionId || session.id,
      airtableRecordId: airtableResult.recordId,
    });
  } catch (err) {
    console.error('Subscription checkout: admin notification failed', session.id, err);
  }

  await fireOnboardingWebhook({
    event: 'payment.received',
    clientName,
    email,
    organization: meta.organization || undefined,
    packageName: plan.displayName,
    amountPaid,
    paymentDate,
    stripeTransactionId: stripeSubscriptionId || session.id,
    airtableRecordId: airtableResult.recordId,
    portalSlug,
    portalLoginUrl,
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'subscription.started',
    title: `Subscription started — ${clientName}`,
    detail: `${plan.displayName}${plan.trialDays ? ` · ${plan.trialDays}-day trial` : ''}`,
    priority: 'high',
    href: portalSlug ? `/portal/${portalSlug}` : '/admin/dashboard',
    tenantId: portalSlug,
    metadata: {
      stripeSessionId: session.id,
      stripeSubscriptionId: stripeSubscriptionId || '',
      planId,
      organizationId: organizationId ?? '',
      email,
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';

  const organizationId = await resolveOrganizationIdForSubscription({
    stripeCustomerId: customerId,
  });

  if (!organizationId || organizationId.startsWith('org_')) return;

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'subscription.invoice.failed',
    title: `Invoice payment failed — ${organizationId}`,
    detail: invoice.id ?? 'unknown invoice',
    priority: 'high',
    href: '/admin/dashboard',
    metadata: { invoiceId: invoice.id, customerId },
  });
}

// ---------------------------------------------------------------------------
// Phase E: proposal-based payment handling (E9 + E10)
// ---------------------------------------------------------------------------

async function handleProposalPayment(
  session: Stripe.Checkout.Session,
  proposalId: string,
  proposalRecordId: string
): Promise<void> {
  // 1. Fetch the full Proposal record (with linked Assessment data).
  let proposal: ProposalWithAssessment | null = null;
  try {
    proposal = await getProposalByRecordId(proposalRecordId);
    if (!proposal) {
      console.error(
        `handleProposalPayment [${proposalId}]: proposal record ${proposalRecordId} not found in Airtable.`
      );
    }
  } catch (err) {
    console.error(`handleProposalPayment [${proposalId}]: getProposalByRecordId threw:`, err);
  }

  // 2. Verify the stored Stripe Session ID matches this event.
  // E8 writes the session ID before redirecting; log a warning if they diverge.
  if (proposal?.stripeSessionId && proposal.stripeSessionId !== session.id) {
    console.warn(
      `handleProposalPayment [${proposalId}]: session ID mismatch.` +
        ` Stored: ${proposal.stripeSessionId}, received: ${session.id}. Proceeding.`
    );
  }

  // 3. Update Proposal status (critical, own try/catch).
  try {
    const statusResult = await updateProposal(proposalRecordId, {
      status: 'Approved & Paid',
    });
    if (!statusResult.ok) {
      console.error(
        `handleProposalPayment [${proposalId}]: status update failed:`,
        statusResult.error
      );
    }
  } catch (err) {
    console.error(`handleProposalPayment [${proposalId}]: status update threw:`, err);
  }

  // 4. Update Payment Status (best-effort; field may not exist yet in Airtable).
  try {
    const paymentStatusResult = await updateProposal(proposalRecordId, {
      paymentStatus: 'Paid',
    });
    if (!paymentStatusResult.ok) {
      console.error(
        `handleProposalPayment [${proposalId}]: payment status update failed:`,
        paymentStatusResult.error
      );
    }
  } catch (err) {
    console.error(`handleProposalPayment [${proposalId}]: payment status update threw:`, err);
  }

  // Derive values for the Client Record and email from the proposal (fallback to
  // session data if the proposal fetch failed).
  const clientName =
    proposal?.contactName || session.customer_details?.name || 'Unknown Client';
  const email =
    proposal?.email ||
    session.customer_details?.email ||
    session.customer_email ||
    '';
  const businessName = proposal?.businessName ?? '';
  const packageLabel =
    proposal?.projectTypeLabel || proposal?.recommendedProjectType || 'Implementation Package';
  const amountPaid = proposal?.recommendedFee ?? (session.amount_total ?? 0) / 100;
  const paymentDate = session.created
    ? new Date(session.created * 1000).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const paymentReceivedAt = session.created
    ? new Date(session.created * 1000).toISOString()
    : new Date().toISOString();
  const stripeTransactionId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? session.id;

  // 5. Create a Client Record so the client can access the portal.
  const airtableResult = await createOrUpdateClientRecord({
    clientName,
    organization: businessName || undefined,
    email,
    packagePurchased: 'Implementation Package',
    amountPaid,
    paymentDate,
    stripeTransactionId,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    paymentReceivedAt,
    lifecycle: lifecycleForPaidClient('Implementation Package'),
  });

  if (!airtableResult.ok) {
    console.error(
      `handleProposalPayment [${proposalId}]: createOrUpdateClientRecord failed:`,
      airtableResult.error
    );
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'onboarding.blocked',
      title: `Proposal paid — Airtable failed for ${clientName}`,
      detail: airtableResult.error ?? 'Client record not created',
      priority: 'critical',
      href: '/admin/proposals',
      metadata: { proposalId, stripeSessionId: session.id, email },
    });
    return;
  }

  // 6. Provision EA portal access and write credentials to the Client Record.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  let portalLoginUrl = `${baseUrl}/portal/login`;
  let portalSlug: string | undefined;
  let tempCredentials: string | undefined;

  if (airtableResult.ok && airtableResult.recordId) {
    try {
      const portalResult = await createPortalAccess(
        {
          clientName,
          email,
          organization: businessName || undefined,
          airtableRecordId: airtableResult.recordId,
        },
        { platform: 'efficiency-architects', loginPath: '/portal/login' }
      );

      if (portalResult.ok) {
        if (portalResult.slug) {
          portalSlug = portalResult.slug;
        }
        if (portalResult.portalLoginUrl) {
          portalLoginUrl = portalResult.portalLoginUrl;
        }
        if (portalResult.username && portalResult.tempPassword) {
          tempCredentials =
            `Your portal login credentials. Email: ${portalResult.username}. ` +
            `Temporary Password: ${portalResult.tempPassword}. ` +
            `Log in using the button above. Contact us to update your password at any time.`;
        }
      } else {
        console.error(
          `handleProposalPayment [${proposalId}]: createPortalAccess failed:`,
          portalResult.error
        );
      }
    } catch (err) {
      console.error(`handleProposalPayment [${proposalId}]: createPortalAccess threw:`, err);
    }
  }

  // 7. Send welcome email to the new client (E10).
  try {
    const welcomeResult = await sendWelcomeEmail({
      clientName,
      email,
      packageName: packageLabel,
      portalLoginUrl,
      tempCredentials,
    });
    if (!welcomeResult.ok) {
      console.error(
        `handleProposalPayment [${proposalId}]: sendWelcomeEmail failed:`,
        welcomeResult.error
      );
    }
  } catch (err) {
    console.error(`handleProposalPayment [${proposalId}]: sendWelcomeEmail threw:`, err);
  }

  await fireOnboardingWebhook({
    event: 'payment.received',
    clientName,
    email,
    organization: businessName || undefined,
    packageName: packageLabel,
    amountPaid,
    paymentDate,
    stripeTransactionId,
    airtableRecordId: airtableResult.recordId,
    portalSlug,
    portalLoginUrl,
  });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'payment.received',
    title: `Proposal paid — ${clientName}`,
    detail: `$${amountPaid.toFixed(2)} · ${packageLabel}`,
    priority: 'high',
    href: '/admin/proposals',
    objectId: airtableResult.recordId,
    metadata: { proposalId, stripeSessionId: session.id, email },
  });
}
