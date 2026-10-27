import Link from 'next/link';
import { MerchantPaymentSetup } from '@/lib/bricks/merchant-onboarding/MerchantPaymentSetup';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'TB3 HQ | Payment Setup', robots: 'noindex, nofollow' };

export default async function Tb3HqPaymentSetup({searchParams}:{searchParams:Promise<{sandbox?:string}>}) {
  const sandbox = (await searchParams).sandbox === '1';
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-10 text-[#F7F5F2]">
      <div className="mx-auto max-w-2xl">
        <Link href="/tarris/future" className="text-sm text-[#E2A8B2] underline">← Back to TB3 HQ</Link>
        <p className="mt-8 text-xs font-bold tracking-[0.24em] text-[#E2A8B2]">TARRIS BOUIE · PRIVATE HQ</p>
        <h1 className="mt-3 text-3xl font-black">Merchandise payment setup</h1>
        <p className="my-5 text-sm text-white/70">
          Verify an existing family-owned Stripe account for TB3. Bank payout details remain in Stripe,
          not this portal. PayPal Business setup is unavailable. Checkout and fulfillment stay disabled
          until independent verification and launch gates pass.
        </p>
        <div className="rounded-2xl bg-white p-2 text-black">
          <MerchantPaymentSetup tenantLabel="TB3" tenantSlug="tarris" initialProvider="stripe" sandbox={sandbox} />
        </div>
      </div>
    </main>
  );
}
