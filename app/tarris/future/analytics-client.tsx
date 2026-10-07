"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TENANT } from "./tenant-config";

type ProductMetric = { id: string; name: string; image: string; download: string; story: string; drop: string; count: number; percent: number };
type WaitlistEntry = { id: string; number: number; name: string; email: string; productId: string; productName: string; createdAt: string };
export type AnalyticsData = { ok: true; totalInnerCircle: number; pageViews: number; viewsAreEstimate: boolean; conversionRate: number; products: ProductMetric[]; topProducts: ProductMetric[]; days: { date: string; count: number }[]; entries: WaitlistEntry[]; recent: WaitlistEntry[]; geoAvailable: boolean };

export function useTb3Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    // TENANT_KEY: endpoint and payload derive from the shared tenant config.
    Promise.all([
      fetch(`/api/${TENANT}/portal-analytics`, { cache: "no-store" }).then(async (response) => {
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(response.status === 401 || response.status === 403 ? "Sign in with staff access to view private portal data." : body.error || "Analytics could not be loaded.");
        return body as AnalyticsData;
      }),
      fetch(`/api/track?tenant=${encodeURIComponent(TENANT)}`, { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body.ok && typeof body.views === "number" ? body.views as number : null;
      }).catch(() => null),
    ])
      .then(([body, realViews]) => {
        if (mounted) {
          // REAL: from /api/track ledger, fallback to estimate until data.
          setData(realViews === null ? body : { ...body, pageViews: realViews, viewsAreEstimate: false, conversionRate: realViews ? Math.round((body.totalInnerCircle / realViews) * 1000) / 10 : 0 });
        }
      })
      .catch((cause: unknown) => { if (mounted) setError(cause instanceof Error ? cause.message : "Analytics could not be loaded."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  return { data, error, loading };
}

function PrivateDataState({ error, loading }: { error: string; loading: boolean }) {
  if (loading) return <div className="grid gap-3 sm:grid-cols-3" aria-label="Loading analytics">{[1,2,3].map((item)=><div key={item} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />)}</div>;
  if (!error) return null;
  return <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm text-white/75">{error}</p><Link href={`/portal/login?next=%2F${TENANT}%2Ffuture`} className="mt-3 inline-block text-xs font-bold text-[#E2A8B2] underline">Sign in to TB3 HQ →</Link></div>;
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-white/50">{label}</p><p className="mt-3 text-3xl font-black text-white">{value}</p><p className="mt-2 text-xs text-white/50">{detail}</p></article>;
}

export function OverviewAnalytics() {
  const { data, error, loading } = useTb3Analytics();
  if (!data) return <section aria-label="Store and inner circle analytics" className="mt-6"><PrivateDataState error={error} loading={loading} /></section>;
  const max = Math.max(1, ...data.days.map((day) => day.count));
  return <section aria-label="Store and inner circle analytics" className="mt-6 space-y-5">
    <div className="grid gap-3 sm:grid-cols-3"><Stat label={data.viewsAreEstimate ? "PAGE VIEWS (EST.)" : "REAL VIEWS"} value={data.pageViews.toLocaleString()} detail={data.viewsAreEstimate ? "Estimated until live view events are available." : `Recorded public page views for ${TENANT}.`} /><Stat label="TB3 INNER CIRCLE" value={data.totalInnerCircle.toLocaleString()} detail="Confirmed Drop 01 signups" /><Stat label="WAITLIST CONVERSION" value={`${data.conversionRate}%`} detail="Confirmed signups ÷ page views" /></div>
    <DigestTester />
    <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">LAST 7 DAYS</p><h2 className="mt-2 text-xl font-black">Inner Circle growth</h2></div><p className="text-xs text-white/50">Signups per day</p></div><div className="mt-6 grid h-36 grid-cols-7 items-end gap-2" aria-label="Waitlist signups by day">{data.days.map((day) => <div key={day.date} className="flex h-full min-w-0 flex-col justify-end text-center"><span className="mb-1 text-[10px] text-white/60">{day.count}</span><div className="min-h-1 rounded-t bg-[#C41E3A]" style={{ height: `${Math.max(4, day.count / max * 82)}%` }} /><span className="mt-2 text-[9px] text-white/45">{new Date(`${day.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}</span></div>)}</div></article>
      <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">FAN SIGNAL</p><h2 className="mt-2 text-xl font-black">{data.totalInnerCircle.toLocaleString()} {data.totalInnerCircle === 1 ? "fan" : "fans"} waiting</h2><p className="mt-1 text-xs text-white/50">State-level location is not collected. Product choices show the current demand mix.</p><div className="mt-5 space-y-3">{data.products.filter((product) => product.count > 0).sort((a, b) => b.count - a.count).slice(0, 5).map((product) => <div key={product.id}><div className="mb-1 flex justify-between gap-3 text-[10px]"><span>{product.name}</span><span className="text-white/55">{product.count} · {product.percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C41E3A]" style={{ width: `${product.percent}%` }} /></div></div>)}{data.totalInnerCircle === 0 && <p className="rounded-lg border border-dashed border-white/15 p-4 text-xs text-white/55">No Inner Circle yet — share your link.</p>}</div></article>
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">MOST WANTED</p><h2 className="mt-2 text-xl font-black">Top products</h2>{data.topProducts.length ? <ol className="mt-4 space-y-3">{data.topProducts.map((product, index) => <li key={product.id} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#A51C30] text-xs font-black">{index + 1}</span><img src={product.image} alt="" className="h-12 w-12 rounded bg-white object-contain"/><div className="min-w-0"><p className="truncate text-xs font-bold">{product.name}</p><p className="mt-1 text-[10px] text-white/50">{product.count} signups</p></div></li>)}</ol> : <p className="mt-4 text-sm text-white/55">No Inner Circle yet — share your link.</p>}</article>
      <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">RECENT SIGNUPS</p><h2 className="mt-2 text-xl font-black">Latest 10</h2>{data.recent.length ? <ul className="mt-4 divide-y divide-white/10">{data.recent.map((entry) => <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-xs"><span><strong className="block">{entry.email}</strong><span className="text-white/50">{entry.productName}</span></span><time className="text-white/45">{new Date(entry.createdAt).toLocaleString()}</time></li>)}</ul> : <p className="mt-4 text-sm text-white/55">No Inner Circle yet — share your link.</p>}</article>
    </div>
  </section>;
}

export function StoreDemandAnalytics() {
  const { data, error, loading } = useTb3Analytics();
  const [sortBy, setSortBy] = useState<"wanted" | "catalog">("wanted");
  function exportCsv() {
    if (!data) return;
    const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = ["Signup Number,Name,Email,Product ID,Product,Created At", ...data.entries.map((entry) => [entry.number, entry.name, entry.email, entry.productId, entry.productName, entry.createdAt].map((value) => cell(String(value))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "tb3-drop-01-inner-circle.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  if (!data) return <PrivateDataState error={error} loading={loading} />;
  const products = sortBy === "wanted" ? [...data.products].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)) : data.products;
  return <>
    <p className="mb-4 rounded-xl border border-[#C41E3A]/30 bg-[#1a1012] p-4 text-sm font-bold">Drop 01 Claimed: {data.totalInnerCircle}/100</p>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button type="button" onClick={() => setSortBy("wanted")} aria-pressed={sortBy === "wanted"} className={`rounded-lg border px-3 py-2 text-xs font-bold ${sortBy === "wanted" ? "border-[#C41E3A] bg-[#C41E3A]" : "border-white/20"}`}>Most wanted</button><button type="button" onClick={() => setSortBy("catalog")} aria-pressed={sortBy === "catalog"} className={`rounded-lg border px-3 py-2 text-xs font-bold ${sortBy === "catalog" ? "border-[#C41E3A] bg-[#C41E3A]" : "border-white/20"}`}>Catalog order</button></div><button type="button" onClick={exportCsv} className="rounded-lg bg-white px-4 py-2 text-xs font-black text-black">Export Drop 01 CSV</button></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]"><div className="aspect-square bg-white p-2"><img src={product.image} alt={product.name} className="h-full w-full object-contain" loading="lazy" /></div><div className="p-3"><h2 className="min-h-10 text-[10px] font-bold leading-5">{product.name}</h2><p className="text-xs font-black text-[#E2A8B2]">{product.count} wanted <span className="font-normal text-white/45">· {product.percent}%</span></p><p title={product.story} className="mt-2 cursor-help text-[10px] text-white/50 underline decoration-dotted underline-offset-4">Product story ⓘ</p><p className="mt-1 text-[10px] text-white/70">{product.story}</p></div></article>)}</div>
    <p className="mt-5 text-xs text-white/45">CSV includes the waitlist contact details and requested products for Drop 01 fulfillment. {data.entries.length} signups currently available.</p>
  </>;
}

export function InnerCircleDirectory() {
  const { data, error, loading } = useTb3Analytics();
  if (!data) return <PrivateDataState error={error} loading={loading} />;
  return <>
    <section className="rounded-2xl border border-[#C41E3A]/40 bg-gradient-to-br from-[#291015] to-[#111] p-6 sm:p-9"><p className="text-[10px] font-bold tracking-[0.24em] text-[#E2A8B2]">DROP 01 · TB3 INNER CIRCLE</p><p className="mt-3 text-5xl font-black">{data.totalInnerCircle.toLocaleString()}</p><p className="mt-2 text-sm text-white/65">confirmed fans waiting for the drop</p></section>
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#141414]"><div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-bold tracking-widest text-white/45 sm:grid-cols-[5rem_1fr_1fr_1fr]"><span>NUMBER</span><span>EMAIL</span><span className="hidden sm:block">PRODUCT</span><span className="hidden sm:block">JOINED</span></div>{data.entries.length ? data.entries.map((entry) => <div key={entry.id} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b border-white/5 px-4 py-4 text-xs last:border-0 sm:grid-cols-[5rem_1fr_1fr_1fr]"><span className="font-black text-[#E2A8B2]">#{entry.number}</span><span className="break-all">{entry.email}<span className="mt-1 block text-[10px] text-white/45 sm:hidden">{entry.productName}</span></span><span className="hidden text-white/75 sm:block">{entry.productName}</span><time className="hidden text-white/50 sm:block">{new Date(entry.createdAt).toLocaleString()}</time></div>) : <p className="p-6 text-sm text-white/55">No Inner Circle yet — share your link.</p>}</section>
  </>;
}


function DigestTester() {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function sendDigest() {
    setBusy(true); setResult("");
    try {
      const query = `?tenant=${encodeURIComponent(TENANT)}`;
      const previewResponse = await fetch(`/api/digest${query}`, { cache: "no-store" });
      const preview = await previewResponse.json();
      if (!previewResponse.ok || !preview.ok) throw new Error(preview.error || "Digest preview failed.");
      const response = await fetch(`/api/digest${query}`, { method: "POST" });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || "Digest email could not be sent.");
      setResult(`Sent to ${body.sentTo}: ${body.subject}`);
    } catch (error) { setResult(error instanceof Error ? error.message : "Digest email could not be sent."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.2em] text-[#C41E3A]">FAMILY DIGEST</p><h2 className="mt-2 text-lg font-black">Weekly TB3 update</h2><button type="button" onClick={sendDigest} disabled={busy} className="mt-4 rounded-lg bg-white px-4 py-3 text-xs font-black text-black disabled:opacity-60">{busy ? "Preparing…" : "Send Test Digest to info@tb3fundamentals.com"}</button>{result&&<p role="status" className="mt-3 text-xs text-white/65">{result}</p>}<p className="mt-2 text-[10px] text-white/40">{/* TODO: Vercel Cron Mon 9am ET */}</p></section>;
}
