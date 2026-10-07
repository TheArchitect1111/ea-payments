import { listPortalFormSubmissions } from "@/lib/portal-forms/store";
import { TB3_PRODUCTS } from "@/app/tarris/data/products";

const TENANT = "tarris"; // TENANT_KEY: prototype tenant for the Alabama athlete showcase.
export const dynamic = "force-dynamic";

type ShowcaseStats = {
  innerCircleCount: number;
  pageViews: number;
  pageViewsAreFallback: boolean;
  topProduct: string;
  nilCount: number;
};

async function loadShowcaseStats(): Promise<ShowcaseStats> {
  try {
    const rows = await listPortalFormSubmissions(TENANT, { kind: "intake" });
    const tenantRows = rows.filter((row) => row.portalSlug === TENANT && row.payload?.tenant === TENANT);
    const waitlist = tenantRows.filter((row) => row.payload?.formType === "merch-waitlist");
    const views = tenantRows.filter((row) => row.payload?.formType === "track-event" && row.payload?.event === "page_view").length;
    const demand = TB3_PRODUCTS.map((product) => ({
      name: product.name,
      count: waitlist.filter((row) => row.payload?.productId === product.id).length,
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const inquiries = tenantRows.filter((row) => row.payload?.formType === "contact" || row.payload?.formType === "nil");
    return {
      innerCircleCount: waitlist.length,
      // fallback until /api/track has data
      pageViews: views || waitlist.length * 3,
      pageViewsAreFallback: views === 0,
      topProduct: demand[0]?.count ? demand[0].name : "No signups yet",
      nilCount: inquiries.length,
    };
  } catch {
    return { innerCircleCount: 0, pageViews: 0, pageViewsAreFallback: true, topProduct: "No signups yet", nilCount: 0 };
  }
}

const capabilities = [
  "Real-time Analytics (page views + demand)",
  "Inner Circle with numbered spots + Fan proof",
  "Store Analytics — demand ranking + CSV export",
  "Vault 🔒 — Owned unreleased content",
  "Legacy Timeline — Past/Present/Future 100-year",
  "Impact Tracker — More Than A Game mission",
  "Brand Assets — 11 files + download tracking",
  "NIL Deal Room — inbox + one-click Media Kit",
  "Content Gallery — 16 official photos family controlled",
];

export default async function AthletesShowcasePage() {
  const stats = await loadShowcaseStats();
  const statCards = [
    { label: "Inner Circle", value: stats.innerCircleCount.toLocaleString() },
    { label: "Page Views", value: stats.pageViews.toLocaleString(), detail: stats.pageViewsAreFallback ? "Estimated until view events arrive" : "Recorded from the tenant ledger" },
    { label: "Top Product", value: stats.topProduct },
    { label: "NIL Inquiries", value: stats.nilCount.toLocaleString() },
  ];

  return <main className="min-h-screen bg-[#090909] text-white">
    <header className="border-b border-white/10 bg-[#101010] px-5 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-7xl"><p className="text-xs font-black tracking-[0.28em] text-[#E2A8B2]">TB3 × EA · ALABAMA ATHLETE PLATFORM</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Future Portal — Built for Alabama</h1><p className="mt-4 text-lg text-white/65">TB3 is the Prototype — 1 of 1</p></div>
    </header>

    <section aria-label="Live TB3 statistics" className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-8 md:grid-cols-4 sm:px-10">{statCards.map((card) => <article key={card.label} className="min-w-0 rounded-2xl border border-white/10 bg-[#151515] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{card.label}</p><p className="mt-3 break-words text-2xl font-black text-white sm:text-3xl">{card.value}</p>{"detail" in card && <p className="mt-2 text-[10px] text-white/45">{card.detail}</p>}</article>)}</section>

    <div className="mx-auto max-w-7xl space-y-14 px-5 pb-16 sm:px-10">
      <section><h2 className="text-2xl font-black sm:text-3xl">What TB3 Has (1 of 1)</h2><ul className="mt-5 grid gap-3 md:grid-cols-2">{capabilities.map((item) => <li key={item} className="rounded-xl border border-white/10 bg-[#141414] p-4 text-sm leading-6"><span className="mr-2 text-[#E2A8B2]" aria-hidden="true">✅</span>{item}</li>)}</ul></section>

      <section><h2 className="text-2xl font-black sm:text-3xl">What Everyone Else Has</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><article className="rounded-2xl border border-white/10 bg-[#141414] p-6"><h3 className="text-lg font-black">AthleteMerch.com / Generic</h3><ul className="mt-4 space-y-3 text-sm text-white/65"><li>Generic template</li><li>No story</li><li>No data</li><li>School owns fans</li></ul></article><article className="rounded-2xl border border-[#C41E3A]/50 bg-gradient-to-br from-[#260e12] to-[#141414] p-6"><h3 className="text-lg font-black">TB3 x EA</h3><ul className="mt-4 space-y-3 text-sm text-white/80"><li>Custom TB3 assets</li><li>Story-driven</li><li>Family owns data</li><li>Tenant-scalable</li></ul></article></div></section>

      <section><h2 className="text-2xl font-black sm:text-3xl">10 Minutes to Yours</h2><ol className="mt-5 space-y-3">{["Copy /app/tarris to /app/[your-name]", "Replace 10 merch PNGs + 16 photos + email", "Deploy — portal auto-creates for new tenant"].map((step, index) => <li key={step} className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#141414] p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#A51C30] text-sm font-black">{index + 1}</span><span className="pt-1 text-sm leading-6">{step}</span></li>)}</ol><p className="mt-4 text-xs text-white/50">Onboarding guide: app/tarris/ONBOARDING.md</p></section>

      <nav aria-label="TB3 demo links" className="flex flex-wrap gap-3"><a href="/tarris" className="rounded-lg border border-white/20 px-4 py-3 text-xs font-bold hover:bg-white/10">Open TB3 public page →</a><a href="/tarris/future" className="rounded-lg border border-white/20 px-4 py-3 text-xs font-bold hover:bg-white/10">Open TB3 family portal →</a></nav>

      <section className="rounded-3xl border border-[#C41E3A]/50 bg-gradient-to-r from-[#2b0b11] to-[#121212] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9"><div><p className="text-[10px] font-bold tracking-[0.22em] text-[#E2A8B2]">BUILD YOUR OWN</p><h2 className="mt-2 text-2xl font-black">Put your story in the center.</h2></div><a href="mailto:info@tb3fundamentals.com?subject=I%20want%20my%20Future%20Portal%20like%20TB3" className="mt-5 inline-flex rounded-lg bg-[#A51C30] px-5 py-4 text-center text-sm font-black text-white hover:bg-[#bd2037] sm:mt-0">Get Your Portal Like TB3 — info@tb3fundamentals.com</a></section>
    </div>
  </main>;
}
