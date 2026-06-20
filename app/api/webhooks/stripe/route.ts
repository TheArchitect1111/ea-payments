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
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';
import { createPortalAccess } from '@/lib/portal-access';
import { createOpportunityRecord } from '@/lib/partner-network';

export const dynamic = 'force-dynamic';

const VALID_PACKAGES: AirtablePackage[] = [
  'Capacity Assessment',
  'Capacity Blueprint',
  'Implementation Package',
  'Simplifi',
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
    default:
      break;
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};

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
  });

  if (!airtableResult.ok) {
    console.error('Airtable write failed for session', session.id, ':', airtableResult.error);
  }

  const catalogItem = meta.packageId ? getCatalogItem(meta.packageId) : undefined;

  let tempCredentials: string | undefined;
  let portalLoginUrl: string =
    catalogItem?.portalLoginUrl ??
    `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app'}/portal/login`;

  if (catalogItem?.portalConfig && airtableResult.ok) {
    try {
      const portalResult = await createPortalAccess(
        {
          clientName,
          email,
          organization: meta.organization || undefined,
          airtableRecordId: airtableResult.recordId,
        },
        catalogItem.portalConfig
      );

      if (portalResult.ok) {
        if (portalResult.portalLoginUrl) {
          portalLoginUrl = portalResult.portalLoginUrl;
        }
        if (portalResult.username && portalResult.tempPassword) {
          tempCredentials =
            `Your portal login credentials: Email: ${portalResult.username} | Temporary Password: ${portalResult.tempPassword}` +
            ' Log in using the button above. Contact us to update your password at any time.';
        }
      } else {
        console.error('Portal access creation failed for session', session.id, ':', portalResult.error);
      }
    } catch (err) {
      console.error('Portal access creation threw for session', session.id, ':', err);
    }
  }

  const referralSource = (meta.referralSource ?? '').trim();
  if (referralSource && airtableResult.ok) {
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
      packageName,
      portalLoginUrl,
      tempCredentials,
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
      packageName,
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
  });

  if (!airtableResult.ok) {
    console.error(
      `handleProposalPayment [${proposalId}]: createOrUpdateClientRecord failed:`,
      airtableResult.error
    );
  }

  // 6. Provision EA portal access and write credentials to the Client Record.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  let portalLoginUrl = `${baseUrl}/portal/login`;
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
}
