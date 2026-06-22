import Link from 'next/link';

export default function LaunchVerificationCancelPage() {
  return (
    <main className="min-h-screen bg-[#0f1729] text-white">
      <div className="border-b border-white/10 bg-[#1B2B4D] px-6 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">Launch Verification</p>
        <h1 className="mt-3 text-2xl font-black">Payment Cancelled</h1>
      </div>

      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm leading-relaxed text-neutral-300">
          No charge was made. Return when you are ready to run the $1.00 production verification.
        </p>

        <Link
          href="/launch-verification"
          className="mt-10 inline-block bg-[#C9A844] px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0f1729] hover:bg-[#d4b85a]"
        >
          Try Again
        </Link>
      </div>
    </main>
  );
}
