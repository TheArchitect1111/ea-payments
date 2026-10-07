"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { TB3_PRODUCTS } from "../../data/products";
import { TarrisPortalFrame } from "../portal-shell";

const TENANT = "tarris"; // TENANT_KEY: change for new athlete.
type Milestone = { title: string; date: string };
type LiveCounts = { totalInnerCircle?: number; nilInquiries?: unknown[] };

export default function TimelinePage() {
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: "100 Inner Circle", date: "Nov 2025" },
    { title: "First NIL Brand Deal", date: "Dec 2025" },
    { title: "Giveback Camp", date: "2026" },
  ]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [innerCircle, setInnerCircle] = useState(0);
  const [nilInquiries, setNilInquiries] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/${TENANT}/portal-analytics`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return null;
      return await response.json() as LiveCounts;
    }).then((body) => {
      if (mounted && body) {
        setInnerCircle(typeof body.totalInnerCircle === "number" ? body.totalInnerCircle : 0);
        setNilInquiries(Array.isArray(body.nilInquiries) ? body.nilInquiries.length : 0);
      }
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  function addMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date.trim()) return;
    setMilestones((current) => [...current, { title: title.trim(), date: date.trim() }]);
    setTitle("");
    setDate("");
  }

  return <TarrisPortalFrame>
    <header className="mb-7"><p className="text-[10px] font-bold tracking-[0.24em] text-[#E2A8B2]">{TENANT.toUpperCase()} · 100-YEAR BRAND</p><h1 className="mt-2 text-3xl font-black">Legacy Blueprint — Past / Present / Future</h1></header>
    <div className="relative space-y-7 border-l border-[#C41E3A]/60 pl-6 sm:pl-8">
      <TimelineCard label="PAST" date="2023"><h2 className="text-lg font-black">Journey to Bama — More Than A Game Started</h2><p className="mt-2 text-sm leading-6 text-white/60">Charlotte. Spire. Alabama. Next. Every stop adds something. Discipline in the classroom, determination on the court, and a bigger purpose than basketball shape the journey.</p></TimelineCard>
      <TimelineCard label="PRESENT" date="DROP 01"><h2 className="text-lg font-black">Drop 01 Live — TB3 Store</h2><dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><Count label="Inner Circle" value={innerCircle} /><Count label="Products" value={TB3_PRODUCTS.length} /><Count label="NIL inquiries" value={nilInquiries} /></dl></TimelineCard>
      <section className="relative"><span className="absolute -left-[2.05rem] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-[#C41E3A] bg-[#0A0A0A] sm:-left-[2.55rem]" /><p className="text-[10px] font-bold tracking-[0.2em] text-[#E2A8B2]">FUTURE</p><h2 className="mt-1 text-xl font-black">Milestones ahead</h2><ol className="mt-4 space-y-3">{milestones.map((milestone, index) => <li key={`${milestone.date}-${milestone.title}-${index}`} className="flex flex-wrap justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] p-4"><span className="text-sm font-bold">{milestone.title}</span><time className="text-xs text-white/50">{milestone.date}</time></li>)}</ol></section>
    </div>
    <form onSubmit={addMilestone} className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-[#141414] p-5 sm:grid-cols-[1fr_12rem_auto]"><label className="text-xs text-white/65">Title<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><label className="text-xs text-white/65">Date<input required value={date} onChange={(event) => setDate(event.target.value)} placeholder="e.g. 2027" className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><button type="submit" className="self-end rounded-lg bg-[#C41E3A] px-4 py-2.5 text-xs font-black">Add Future Milestone</button></form>
  </TarrisPortalFrame>;
}

function TimelineCard({ label, date, children }: { label: string; date: string; children: ReactNode }) {
  return <section className="relative"><span className="absolute -left-[2.05rem] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-[#C41E3A] bg-[#0A0A0A] sm:-left-[2.55rem]" /><p className="text-[10px] font-bold tracking-[0.2em] text-[#E2A8B2]">{label} · {date}</p><article className="mt-3 rounded-2xl border border-white/10 bg-[#141414] p-5">{children}</article></section>;
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-white/10 bg-black/30 p-4"><dt className="text-[10px] font-bold uppercase tracking-widest text-white/45">{label}</dt><dd className="mt-2 text-2xl font-black">{value.toLocaleString()}</dd></div>;
}
