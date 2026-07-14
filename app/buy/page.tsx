import Link from 'next/link';
import { getCommerceOffer } from '@ea/payments-contract';

export const metadata = {
  title: 'Website + Portal Starter | Efficiency Architects',
  description:
    'Buy a live branded website and client portal on the EA hub — provisioned automatically after checkout.',
};

const CHECKOUT_HREF = '/checkout?package=website_portal_starter';

export default function BuyPage() {
  const offer = getCommerceOffer('website_portal_starter');
  const price =
    offer?.priceCents != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(offer.priceCents / 100)
      : '$2,497';

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-neutral-950 px-6 py-8 text-center text-white">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-neutral-400">
          Efficiency Architects
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
          Website + Portal Starter
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-300">
          Pay once. Go live on the EA hub with a branded website and lean client portal — no build
          queue, no human approval gate.
        </p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="border border-neutral-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              What you get instantly
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              <li>
                <strong className="text-neutral-900">Live website</strong> at{' '}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">/sites/&#123;your-slug&#125;</code>
              </li>
              <li>
                <strong className="text-neutral-900">Client portal</strong> with updates, resources,
                messages, documents, training, and ask
              </li>
              <li>
                <strong className="text-neutral-900">Welcome email</strong> with one-click magic
                login (48h) plus password backup
              </li>
              <li>
                <strong className="text-neutral-900">Success screen</strong> that shows your live
                site link as soon as provisioning finishes
              </li>
            </ul>
          </div>

          <div className="border border-neutral-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              How it works
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-neutral-700">
              <li>Checkout with your business name, email, and optional tagline.</li>
              <li>Stripe confirms payment.</li>
              <li>We auto-create your portal slug, entitlements, and published starter site.</li>
              <li>Open your site and sign in — usually within a minute.</li>
            </ol>
          </div>
        </section>

        <aside className="border border-neutral-900 bg-white p-6 shadow-sm lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">One-time</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{price}</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {offer?.description ||
              'Instant branded website and client portal on the EA hub after checkout.'}
          </p>

          <Link
            href={CHECKOUT_HREF}
            className="mt-6 flex w-full items-center justify-center bg-neutral-950 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
          >
            Continue to checkout
          </Link>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            Already purchased?{' '}
            <Link href="/portal/login" className="font-semibold text-neutral-800 underline">
              Client login
            </Link>
          </p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Need a custom domain or white-glove build later? Start here, upgrade when you are
            ready.
          </p>
        </aside>
      </div>
    </main>
  );
}
