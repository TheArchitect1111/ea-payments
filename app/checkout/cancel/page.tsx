export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
      </div>

      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-extrabold uppercase tracking-wide text-neutral-900">
          Payment Cancelled
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Your payment was not completed and no charges were made. You can return to checkout
          whenever you are ready.
        </p>

        <a
          href="/checkout"
          className="mt-10 inline-block bg-neutral-950 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
        >
          Return to Checkout
        </a>
      </div>
    </main>
  );
}
