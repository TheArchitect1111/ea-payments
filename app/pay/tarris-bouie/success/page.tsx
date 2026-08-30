import { getStripe } from '@/lib/stripe';
import { syncTarrisContractPayment } from '@/lib/tarris-contract-payment';

export const dynamic = 'force-dynamic';

export default async function TarrisPaymentSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let paid = false;
  let message = 'We could not verify this payment. Please contact Efficiency Architects.';

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const result = await syncTarrisContractPayment(session);
      paid = result.ok;
      message = paid
        ? 'Your $500 project deposit has been verified and recorded. Your agreement and payment are now connected in the Efficiency Architects system.'
        : (result.error || message);
    } catch (error) {
      console.error('[tarris-payment] success verification failed', error);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Efficiency Architects</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950">{paid ? 'Deposit Received' : 'Payment Verification'}</h1>
        <div className="my-8 border-y border-neutral-200 py-7">
          <div className="text-sm text-neutral-500">Tarris Bouie Client Services Agreement</div>
          <div className="mt-1 text-5xl font-bold text-neutral-950">{paid ? '$500 Paid' : 'Check Required'}</div>
        </div>
        <p className="text-neutral-600 leading-7">{message}</p>
        {paid ? <p className="mt-6 text-sm font-semibold text-neutral-900">Next: Efficiency Architects begins the contracted implementation.</p> : null}
      </section>
    </main>
  );
}
