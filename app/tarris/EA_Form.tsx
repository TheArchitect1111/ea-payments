"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TENANT } from "./future/tenant-config";

type EAFormProps = {
  tenant: typeof TENANT;
  formType: "merch-waitlist";
  productId: string;
  cta: "Join Waitlist";
  placeholder: "Email for Drop 01";
};
export default function EA_Form({ tenant, formType, productId, cta, placeholder }: EAFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setStatus(""); setError("");
    const data = new FormData(form);
    try {
      const response = await fetch(`/api/${tenant}/merch-waitlist`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant, formType, productId, name: String(data.get("name") || ""), email: String(data.get("email") || ""), website: String(data.get("website") || "") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Please try again.");
      const position = Math.max(1, Number(result.position) || 1);
      form.reset(); setStatus(`You are #${position} in TB3 Inner Circle — Drop 01`); setCelebrating(true);
      const code = `TB3-IC-${String(position).padStart(3, "0")}`;
      window.setTimeout(() => router.push(`/tarris/welcome?member=${position}&code=${encodeURIComponent(code)}`), 1000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The waitlist signup could not be saved. Please try again.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="relative mt-1 grid gap-2 overflow-visible">
    <label className="sr-only" htmlFor={`waitlist-name-${productId}`}>Name</label>
    <input id={`waitlist-name-${productId}`} name="name" required maxLength={120} autoComplete="name" placeholder="Your name" className="w-full rounded border border-black/20 bg-white px-3 py-2 text-xs" />
    <label className="sr-only" htmlFor={`waitlist-email-${productId}`}>Email</label>
    <input id={`waitlist-email-${productId}`} name="email" type="email" required maxLength={254} autoComplete="email" placeholder={placeholder} className="w-full rounded border border-black/20 bg-white px-3 py-2 text-xs" />
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
    <button type="submit" disabled={busy} className="w-full animate-[tb3-glow_2.4s_ease-in-out_infinite] rounded bg-[#A51C30] px-3 py-2.5 text-[10px] font-bold tracking-wider text-white transition hover:bg-[#bd2037] disabled:opacity-70">{busy ? "Joining…" : cta}</button>
    {celebrating && <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">{Array.from({ length: 14 }, (_, index) => <i key={index} className="tb3-confetti absolute left-1/2 top-1/2 h-2 w-2 rounded-sm bg-[#C41E3A]" style={{ "--dx": `${(index - 6.5) * 13}px`, "--dy": `${-Math.abs(index - 6.5) * 9 - 12}px`, animationDelay: `${(index % 4) * 35}ms` } as CSSProperties} />)}</span>}
    <style>{`@keyframes tb3-glow{0%,100%{box-shadow:0 0 8px rgba(165,0,20,.32)}50%{box-shadow:0 0 14px rgba(165,0,20,.55)}}@keyframes tb3-burst{0%{transform:translate(-50%,-50%) scale(.4);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(160deg);opacity:0}}.tb3-confetti{animation:tb3-burst .9s ease-out forwards}`}</style>
    {status && <p role="status" className="text-xs font-semibold text-green-800">{status}</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </form>;
}
