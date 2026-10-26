export const metadata = { title: 'TB3 Stripe Setup', robots: 'noindex, nofollow' };
export default function StripeSetupComplete() {
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-3xl font-bold">TB3 payment setup</h1><p className="mt-5">Thank you. You have returned from Stripe. The TB3 administrator must verify your account status before payments can be activated.</p><a href="/tarris" className="underline">Return to TB3</a></main>;
}