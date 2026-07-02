import Link from 'next/link';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const isSubscription = type === 'subscription';

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
      </div>

      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-600">
          &#10003;
        </div>

        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
          {isSubscription ? 'Subscription Started' : 'Payment Received'}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          {isSubscription
            ? 'Your subscription is active. A confirmation receipt is on its way to your email.'
            : 'Your payment has been processed successfully. A confirmation receipt is on its way to your email.'}
        </p>

        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {isSubscription
            ? 'Watch for your welcome email with portal access. Manage billing anytime from your portal after you sign in.'
            : 'Your onboarding has been queued. Watch for your welcome email with portal access, next steps, and the first items needed to begin delivery.'}
        </p>

        <Link
          href="/portal/login"
          className="mt-10 inline-block bg-neutral-950 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
        >
          Client Login
        </Link>
      </div>
    </main>
  );
}
