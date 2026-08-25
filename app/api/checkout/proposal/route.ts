import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getProposalByProposalId, updateProposal } from '@/lib/airtable';
import { getCtpSubmissionByProposalId } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { proposalDeposit } from '@/lib/proposal-deposit';

export const dynamic = 'force-dynamic';
const CHECKOUT_STATUSES = new Set(['Approved', 'Sent']);

export async function POST(req: NextRequest): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  let proposalId = '';
  let paymentStage: 'deposit' | 'final' = 'deposit';

  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = (await req.json()) as { proposalId?: string; paymentStage?: string };
      proposalId = json.proposalId?.trim() ?? '';
      paymentStage = json.paymentStage === 'final' ? 'final' : 'deposit';
    } else {
      const formData = await req.formData();
      proposalId = ((formData.get('proposalId') as string | null) ?? '').trim();
      paymentStage = formData.get('paymentStage') === 'final' ? 'final' : 'deposit';
    }
  } catch (err) {
    console.error('checkout/proposal: failed to parse request body:', err);
  }

  if (!proposalId) return NextResponse.redirect(`${baseUrl}/?payment=error`, { status: 303 });

  const proposalUrl = `${baseUrl}/proposal/${encodeURIComponent(proposalId)}`;
  const ctpBound = await getCtpSubmissionByProposalId(proposalId).catch(() => null);
  const errorRedirect = (reason: string) => {
    console.error(`checkout/proposal [${proposalId}]:`, reason);
    return NextResponse.redirect(`${proposalUrl}?payment=error`, { status: 303 });
  };

  if (!process.env.STRIPE_SECRET_KEY) return errorRedirect('STRIPE_SECRET_KEY not set.');

  let proposal;
  try { proposal = await getProposalByProposalId(proposalId); }
  catch (err) { return errorRedirect(`getProposalByProposalId threw: ${err instanceof Error ? err.message : String(err)}`); }

  if (!proposal) return errorRedirect('Proposal not found in Airtable.');
  if (!CHECKOUT_STATUSES.has(proposal.status)) return errorRedirect(`Proposal status "${proposal.status}" is not eligible for checkout.`);
  if (!proposal.recommendedFee || proposal.recommendedFee <= 0) return errorRedirect('Proposal has no valid recommended fee.');

  const standardDeposit = proposalDeposit(proposal.recommendedFee, ctpBound?.discoveryAnswers);
  const depositAmount = proposal.recommendedProjectType === 'Quick Quote'
    ? Math.min(Math.max(proposal.rawFee || standardDeposit, 0), proposal.recommendedFee)
    : standardDeposit;
  const chargeAmount = paymentStage === 'final' ? Math.max(0, proposal.recommendedFee - depositAmount) : depositAmount;
  const unitAmount = Math.round(chargeAmount * 100);
  if (unitAmount <= 0) return errorRedirect('No remaining balance is due.');

  const productName = [proposal.projectTypeLabel || proposal.recommendedProjectType, proposal.businessName].filter(Boolean).join(' - ') || 'Efficiency Architects Engagement';
  const paymentLabel = paymentStage === 'final' ? 'Final Balance' : 'Project Deposit';
  const isQuickQuote = proposal.recommendedProjectType === 'Quick Quote';
  const guideReturnUrl = isQuickQuote
    ? `${baseUrl}/project-secured/${encodeURIComponent(proposal.proposalId)}?stage=${paymentStage}&session_id={CHECKOUT_SESSION_ID}`
    : ctpBound?.portalSlug
      ? `${baseUrl}${designStudioPath(ctpBound.portalSlug)}?payment=success`
      : `${proposalUrl}?payment=success`;

  try {
    const stripe = getStripe();
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: `${productName} - ${paymentLabel}`,
            description: paymentStage === 'final'
              ? `Final balance due before activation and full administrator access. Total project price: $${proposal.recommendedFee.toLocaleString()}.`
              : `Deposit toward a total project price of $${proposal.recommendedFee.toLocaleString()}.`,
          },
        },
      }],
      customer_email: proposal.email || undefined,
      metadata: {
        proposalId: proposal.proposalId,
        airtableRecordId: proposal.id,
        paymentStage,
        projectTotal: String(proposal.recommendedFee),
        quickQuote: isQuickQuote ? 'true' : 'false',
      },
      success_url: guideReturnUrl,
      cancel_url: `${baseUrl}/commitment/${encodeURIComponent(proposal.proposalId)}?payment=cancelled`,
    };

    sessionParams.custom_text = {
      after_submit: {
        message: paymentStage === 'final'
          ? 'Thank you. Your final balance has been received. EA will complete activation and provide full access.'
          : 'Thank you. Your deposit reserves the agreed development window. The final balance is due after review and before activation or full access.',
      },
    };

    if (unitAmount > 250000) sessionParams.invoice_creation = { enabled: true };
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) return errorRedirect('Stripe returned a session with no URL.');

    try { await updateProposal(proposal.id, { stripeSessionId: session.id }); }
    catch (err) { console.error('checkout/proposal: failed to save Stripe session ID to Airtable:', err); }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    return errorRedirect(err instanceof Error ? err.message : 'Unknown Stripe error');
  }
}
