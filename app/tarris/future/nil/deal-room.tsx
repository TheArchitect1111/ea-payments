"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TarrisPortalFrame } from "../portal-shell";
import { PORTAL_BASE, TENANT } from "../tenant-config";

type Stage = "New" | "Contacted" | "Deal" | "Closed";
type Inquiry = { id: string; companyName: string; name: string; email: string; phone: string; inquiryType: string; budgetRange: string; dateRequested: string; message: string; status: string; createdAt: string };
type InquiryMeta = { stage: Stage; value: number };
type MetaMap = Record<string, InquiryMeta>;
const stages: Stage[] = ["New", "Contacted", "Deal", "Closed"];

export default function DealRoom() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [meta, setMeta] = useState<MetaMap>({});
  const [message, setMessage] = useState("Loading NIL inquiries…");
  const [copied, setCopied] = useState(false);
  const [amountInput, setAmountInput] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    fetch(`/api/${TENANT}/portal-analytics`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok || !body.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with an active TB3 staff account to view private inquiries." : body.error || "NIL inquiries could not be loaded."); return body; })
      .then((body) => { if (!mounted) return; const inquiries = Array.isArray(body.nilInquiries) ? body.nilInquiries as Inquiry[] : []; setRows(inquiries); setMessage(inquiries.length ? "" : "No NIL inquiries yet. New contact and partnership submissions will appear here."); })
      .catch((error: unknown) => { if (mounted) setMessage(error instanceof Error ? error.message : "NIL inquiries could not be loaded."); });
    return () => { mounted = false; };
  }, []);
  function updateMeta(id: string, update: Partial<InquiryMeta>) {
    setMeta((current) => {
      return { ...current, [id]: { stage: current[id]?.stage || "New", value: current[id]?.value || 0, ...update } };
    });
  }
  async function copyMediaKit() {
    const url = `${window.location.origin}${PORTAL_BASE}/nil/media-kit`;
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setMessage(`Copy unavailable. Share this link: ${url}`); }
  }
  const openCount = rows.filter((row) => (meta[row.id]?.stage || "New") !== "Closed").length;
  const closedCount = rows.length - openCount;
  const pipelineTotal = useMemo(() => Object.values(meta).reduce((sum, item) => sum + (item.stage === "Closed" ? Number(item.value) || 0 : 0), 0), [meta]);
  const mediaUrl = typeof window === "undefined" ? `https://tb3.online${PORTAL_BASE}/nil/media-kit` : `${window.location.origin}${PORTAL_BASE}/nil/media-kit`;
  return <TarrisPortalFrame contentClassName="max-w-screen-2xl"><header className="mb-8"><p className="text-[10px] font-bold tracking-[0.24em] text-[#C41E3A]">TB3 HQ · BRAND PARTNERSHIPS</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">NIL DEAL ROOM</h1><p className="mt-3 max-w-2xl text-sm text-white/60">Review incoming public booking and partnership inquiries, then send the approved media kit.</p><p className="mt-3 text-[9px] font-bold uppercase tracking-wider text-[#E2A8B2]">Inquiries forwarded to info@tb3fundamentals.com</p><p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-white/45">NCAA COMPLIANT • FAMILY OWNED</p></header>
    <div className="mb-6 flex flex-wrap gap-3"><Link href={`${PORTAL_BASE}/nil/media-kit`} className="rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-black text-white">Generate Media Kit →</Link><button type="button" onClick={copyMediaKit} className="rounded-lg border border-white/20 px-4 py-3 text-xs font-bold">{copied ? "Link Copied ✓" : "Copy Media Kit Link"}</button><a href={`mailto:info@tb3fundamentals.com?subject=${encodeURIComponent("TB3 Media Kit — Tarris Bouie")}&body=${encodeURIComponent(`TB3 media kit: ${mediaUrl}\nInner Circle inquiries: ${rows.length}\nNCAA COMPLIANT • FAMILY OWNED`)}`} className="rounded-lg border border-white/20 px-4 py-3 text-xs font-bold">Email Media Kit</a></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><article className="rounded-xl border border-white/10 bg-[#141414] p-4"><p className="text-[9px] font-bold tracking-widest text-white/45">PIPELINE TOTAL</p><p className="mt-2 text-2xl font-black">${pipelineTotal.toLocaleString()}</p></article><article className="rounded-xl border border-white/10 bg-[#141414] p-4"><p className="text-[9px] font-bold tracking-widest text-white/45">OPEN</p><p className="mt-2 text-2xl font-black">{openCount}</p></article><article className="rounded-xl border border-white/10 bg-[#141414] p-4"><p className="text-[9px] font-bold tracking-widest text-white/45">CLOSED</p><p className="mt-2 text-2xl font-black">{closedCount}</p></article></div>
    {message ? <p role="status" className="rounded-xl border border-white/10 bg-[#141414] p-5 text-sm text-white/65">{message}</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{stages.map((stage) => {
      const inStage = rows.filter((row) => (meta[row.id]?.stage || "New") === stage);
      return <section key={stage} className="min-h-40 rounded-xl border border-white/10 bg-[#101010] p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest">{stage}</h2><span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">{inStage.length}</span></div>
        {inStage.map((row) => { const currentIndex = stages.indexOf(stage); const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)]; const item = meta[row.id] || { stage: "New" as Stage, value: 0 };
          return <article key={row.id} className="mb-3 rounded-lg border border-white/10 bg-[#191919] p-3"><h3 className="text-sm font-bold">{row.companyName || row.name || "NIL inquiry"}</h3><p className="mt-1 break-all text-[10px] text-white/60">{row.name} · {row.email}</p><p className="mt-2 text-[10px] text-white/50">{row.inquiryType}</p>{row.message && <p className="mt-2 text-xs text-white/70">{row.message.slice(0, 180)}{row.message.length > 180 ? "…" : ""}</p>}<time className="mt-2 block text-[9px] text-white/40">{new Date(row.createdAt).toLocaleDateString()}</time>
            {stage !== "Closed" ? <button type="button" onClick={() => updateMeta(row.id, { stage: nextStage })} className="mt-3 rounded bg-[#C41E3A] px-3 py-2 text-[10px] font-bold">Move to {nextStage}</button> : <div className="mt-3 flex gap-2"><input aria-label={`Deal value for ${row.companyName || row.name}`} inputMode="decimal" value={amountInput[row.id] ?? String(item.value || "")} onChange={(event) => setAmountInput((current) => ({ ...current, [row.id]: event.target.value }))} placeholder="$ amount" className="min-w-0 flex-1 rounded border border-white/15 bg-black px-2 py-2 text-xs" /><button type="button" onClick={() => updateMeta(row.id, { stage: "Closed", value: Math.max(0, Number(amountInput[row.id]) || 0) })} className="rounded border border-white/20 px-2 text-[10px] font-bold">Set $</button></div>}
          </article>;
        })}
        {!inStage.length && <p className="rounded-lg border border-dashed border-white/10 p-3 text-[10px] text-white/40">No inquiries in this stage.</p>}
      </section>;
    })}</div>}
  </TarrisPortalFrame>;
}
