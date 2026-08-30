export const dynamic='force-dynamic';

export default async function ContractTestSuccess({searchParams}:{searchParams:Promise<{session_id?:string}>}) {
  const {session_id:sessionId}=await searchParams;
  let paid=false;
  let message='We could not verify this payment yet.';
  if(sessionId){
    try{
      const r=await fetch(`https://efficiency-architects.vercel.app/api/contracts/verify-contract-test-payment?session_id=${encodeURIComponent(sessionId)}`,{cache:'no-store',headers:{Accept:'application/json'}});
      const d=await r.json().catch(()=>({}));
      paid=r.ok&&d?.ok===true&&d?.status==='PAID_AND_ARCHIVED';
      message=paid?'Your payment has been received and securely recorded. No further payment action is required.':(d?.error||message);
    }catch{}
  }

  return <main className="min-h-screen bg-neutral-50 px-5 py-10 text-neutral-900">
    <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="px-7 py-9 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">Efficiency Architects</p>
        <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-2xl text-white">✓</div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{paid?'Payment received. You’re all set.':'We’re confirming your payment.'}</h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">{message}</p>

        {paid ? <>
          <div className="mt-8 rounded-2xl bg-neutral-50 p-6">
            <h2 className="text-lg font-semibold">What happens next</h2>
            <div className="mt-5 space-y-5">
              <div className="flex gap-4"><span className="font-semibold">01</span><div><p className="font-semibold">Your agreement is recorded</p><p className="mt-1 text-sm leading-6 text-neutral-600">Your signed agreement and payment record are saved with your project information.</p></div></div>
              <div className="flex gap-4"><span className="font-semibold">02</span><div><p className="font-semibold">We begin project setup</p><p className="mt-1 text-sm leading-6 text-neutral-600">Efficiency Architects reviews the approved scope, organizes your project, and prepares the work outlined in your agreement.</p></div></div>
              <div className="flex gap-4"><span className="font-semibold">03</span><div><p className="font-semibold">You receive your next-step instructions</p><p className="mt-1 text-sm leading-6 text-neutral-600">We will contact you with any information or materials needed from you and explain the next milestone.</p></div></div>
            </div>
          </div>
          <div className="mt-7 border-t border-neutral-200 pt-6">
            <h2 className="font-semibold">What you should expect</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">You do not need to submit the agreement or payment again. Keep an eye on your email for project communication and requests from Efficiency Architects.</p>
            <p className="mt-5 text-sm font-medium">You may safely close this page.</p>
          </div>
        </> : <div className="mt-8 rounded-2xl bg-neutral-50 p-6"><h2 className="font-semibold">Please keep this page open</h2><p className="mt-2 text-sm leading-6 text-neutral-600">Payment confirmation may take a moment. Refresh this page once. If it still does not confirm, contact Efficiency Architects before attempting another payment.</p></div>}
      </div>
    </section>
  </main>
}
