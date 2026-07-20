import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getProposalByProposalId, updateProposal } from '@/lib/airtable';
import { getCtpSubmissionByProposalId } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';

export const dynamic = 'force-dynamic';

// Statuses that are eligible for checkout. "Approved & Paid" is excluded
// so re-submitting the form after a successful payment does not create a
// second session.
const CHECKOUT_STATUSES = new Set(['Approved', 'Sent']);

export async function POST(req: NextRequest): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  // Parse proposalId from either a form POST or a JSON body.
  let proposalId = '';
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = (await req.json()) as { proposalId?: string };
      proposalId = json.proposalId?.trim() ?? '';
    } else {
      const formData = await req.formData();
      proposalId = ((formData.get('proposalId') as string | null) ?? '').trim();
    }
  } catch (err) {
    console.error('checkout/proposal: failed to parse request body:', err);
  }

  if (!proposalId) {
    // No proposal ID at all; redirect to a safe page.
    return NextResponse.redirect(`${baseUrl}/?payment=error`, { status: 303 });
  }

  const proposalUrl = `${baseUrl}/proposal/${encodeURIComponent(proposalId)}`;
  const ctpBound = await getCtpSubmissionByProposalId(proposalId).catch(() => null);
  const guideReturnUrl = ctpBound?.portalSlug
    ? `${baseUrl}${designStudioPath(ctpBound.portalSlug)}?payment=success`
    : `${proposalUrl}?payment=success`;

  const errorRedirect = (reason: string) => {
    console.error(`checkout/proposal [${proposalId}]:`, reason);
    return NextResponse.redirect(`${proposalUrl}?payment=error`, { status: 303 });
  };

  if (!process.env.STRIPE_SECRET_KEY) {
    return errorRedirect('STRIPE_SECRET_KEY not set.');
  }

  let proposal;
  try {
    proposal = await getProposalByProposalId(proposalId);
  } catch (err) {
    return errorRedirect(`getProposalByProposalId threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!proposal) {
    return errorRedirect('Proposal not found in Airtable.');
  }

  if (!CHECKOUT_STATUSES.has(proposal.status)) {
    return errorRedirect(`Proposal status "${proposal.status}" is not eligible for checkout.`);
  }

  if (!proposal.recommendedFee || proposal.recommendedFee <= 0) {
    return errorRedirect('Proposal has no valid recommended fee.');
  }

  // Airtable Currency fields are stored as floating-point dollars.
  // Multiply by 100 and round to get Stripe unit_amount (integer cents).
  // Example: $4,997.00 -> 4997 * 100 = 499700 cents.
  const unitAmount = Math.round(proposal.recommendedFee * 100);

  const productName =
    [proposal.projectTypeLabel || proposal.recommendedProjectType, proposal.businessName]
      .filter(Boolean)
      .join(' - ') || 'Efficiency Architects Engagement';

  try {
    const stripe = getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: productName,
            },
          },
        },
      ],
      customer_email: proposal.email || undefined,
      metadata: {
        proposalId: proposal.proposalId,
        airtableRecordId: proposal.id,
      },
      success_url: guideReturnUrl,
      cancel_url: `${proposalUrl}?payment=cancelled`,
    };

    // Recommend ACH for all proposal amounts (minimum tier is $1,497).
    sessionParams.custom_text = {
      after_submit: {
        message:
          'ACH bank transfer is available for this amount and carries lower processing fees. Select "US Bank Account" if available at checkout.',
      },
    };

    // Enable invoice creation for amounts above $2,500.
    if (unitAmount > 250000) {
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return errorRedirect('Stripe returned a session with no URL.');
    }

    // Best-effort: save the session ID on the proposal so E9 can match it.
    // A failure here does not abort the checkout.
    try {
      await updateProposal(proposal.id, { stripeSessionId: session.id });
    } catch (err) {
      console.error('checkout/proposal: failed to save Stripe session ID to Airtable:', err);
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    return errorRedirect(err instanceof Error ? err.message : 'Unknown Stripe error');
  }
}
