import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createOrUpdateClientRecord } from '@/lib/airtable';
import type { AirtablePackage } from '@/lib/airtable';
import { getCatalogItem } from '@/lib/catalog';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';
import { createPortalAccess } from '@/lib/portal-access';
import { createOpportunityRecord } from '@/lib/partner-network';

export const dynamic = 'force-dynamic';

const VALID_PACKAGES: AirtablePackage[] = [
  'Capacity Assessment',
  'Capacity Blueprint',
  'Implementation Package',
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
            ' — Log in using the button above. Contact us to update your password at any time.';
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
