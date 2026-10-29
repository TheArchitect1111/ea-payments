'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Model = { available: true; cents: number; payment: { sessionId: string; entitlement: string }; delivery: { successPage: string; accessLink: string; emailId: string; receiptPdf: string; nextSteps: string } };
export function ChassisPreview() {
  const [model, setModel] = useState<Model | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let active = true;
    fetch('/api/chassis/tarris/contract').then(async response => response.ok ? response.json() : null).then(data => { if (active && data?.available === true) setModel(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!model) return null;
  return <section aria-label="Staging checkout preview" className="border-b border-black/20 py-8">
    <p className="text-xs font-bold">STAGING PREVIEW · CONTRACT ONLY · NOT LIVE</p>
    <p className="mt-2 text-sm">No payment is charged, email sent, receipt delivered, or learning access granted.</p>
    {step === 0 && <button type="button" onClick={() => setStep(1)} className="mt-4 border px-4 py-2">Preview checkout · {(model.cents / 100).toFixed(2)} configured price</button>}
    {step >= 1 && <div className="mt-4 text-sm"><p>Modeled checkout: {model.payment.sessionId}</p><p>Modeled success: {model.delivery.successPage}</p><button type="button" onClick={() => setStep(2)} className="mt-3 border px-4 py-2">Preview learning and delivery</button></div>}
    {step === 2 && <div className="mt-4 break-words text-sm"><p>Modeled learning: {model.delivery.accessLink}</p><p>Mock email, not sent: {model.delivery.emailId}</p><p>Mock receipt, not a delivered PDF: {model.delivery.receiptPdf}</p><p>{model.delivery.nextSteps}</p></div>}
    <Link href="/tarris/future" className="mt-4 inline-block underline">Enter TB3 HQ →</Link>
  </section>;
}
