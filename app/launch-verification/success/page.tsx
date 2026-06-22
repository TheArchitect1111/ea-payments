import Link from 'next/link';

export default function LaunchVerificationSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0f1729] text-white">
      <div className="border-b border-emerald-400/30 bg-[#1B2B4D] px-6 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">Launch Verification</p>
        <h1 className="mt-3 text-3xl font-black">Payment Verified</h1>
      </div>

      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 text-3xl font-bold text-emerald-400">
          &#10003;
        </div>

        <p className="text-sm leading-relaxed text-neutral-300">
          Your $1.00 Launch Verification payment was received. The production workflow should now have:
        </p>

        <ul className="mt-6 space-y-2 text-left text-sm text-neutral-400">
          <li>Client Record in Airtable (Package: Launch Verification)</li>
          <li>Onboarding Status: Launch Verification</li>
          <li>Welcome email via Resend</li>
          <li>Admin notification email</li>
          <li>Make onboarding webhook fired</li>
          <li>Pulse event logged</li>
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/launch"
            className="inline-block bg-[#C9A844] px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0f1729] hover:bg-[#d4b85a]"
          >
            Open Launch Command Center
          </Link>
          <Link
            href="/launch-verification"
            className="inline-block border border-white/20 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/5"
          >
            Run Again
          </Link>
        </div>
      </div>
    </main>
  );
}
