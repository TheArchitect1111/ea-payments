"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { TarrisPortalFrame } from "../portal-shell";

const TENANT = "tarris"; // TENANT_KEY: change for new athlete.
type ImpactEntry = { id: number; date: string; hours: number; description: string; photoUrl: string };

export default function ImpactPage() {
  const [entries, setEntries] = useState<ImpactEntry[]>([]);
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const totals = useMemo(() => ({
    hours: entries.reduce((sum, entry) => sum + entry.hours, 0),
    kids: 0,
    events: entries.length,
    dollars: 0,
  }), [entries]);
  // TODO: tenant ledger contentType="impact" when table exists

  function logImpact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !description.trim()) return;
    setEntries((current) => [{ id: Date.now(), date, hours: Number(hours) || 0, description: description.trim(), photoUrl: photoUrl.trim() }, ...current]);
    setDate(""); setHours(""); setDescription(""); setPhotoUrl("");
  }

  return <TarrisPortalFrame>
    <header className="mb-6"><p className="text-[10px] font-bold tracking-[0.24em] text-[#E2A8B2]">{TENANT.toUpperCase()} · MORE THAN A GAME</p><h1 className="mt-2 text-3xl font-black">Impact — More Than A Game Tracker</h1><p className="mt-2 text-xs text-white/50">Logged by family</p></header>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><ImpactStat label="Hours Volunteered" value={totals.hours.toLocaleString()} /><ImpactStat label="Kids Mentored" value={totals.kids.toLocaleString()} /><ImpactStat label="Community Events" value={totals.events.toLocaleString()} /><ImpactStat label="$ Given Back" value={`$${totals.dollars.toLocaleString()}`} /></div>
    <p className="mt-7 rounded-2xl border border-[#C41E3A]/30 bg-[#1C0C10] p-5 text-lg font-bold">This is what separates TB3 — not merch, but mission.</p>
    <form onSubmit={logImpact} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-[#141414] p-5 md:grid-cols-2"><label className="text-xs text-white/65">Date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><label className="text-xs text-white/65">Hours (number)<input type="number" min="0" step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><label className="text-xs text-white/65 md:col-span-2">Description<textarea required value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><label className="text-xs text-white/65 md:col-span-2">Photo URL (optional)<input type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white" /></label><button type="submit" className="rounded-lg bg-[#C41E3A] px-4 py-3 text-xs font-black md:col-span-2">Log Impact</button></form>
    <section className="mt-7"><h2 className="text-xl font-black">Impact log</h2>{entries.length ? <ul className="mt-4 space-y-3">{entries.map((entry) => <li key={entry.id} className="rounded-xl border border-white/10 bg-[#141414] p-4"><div className="flex flex-wrap justify-between gap-2"><time className="text-xs text-[#E2A8B2]">{entry.date}</time><span className="text-xs text-white/50">{entry.hours} hours</span></div><p className="mt-2 text-sm">{entry.description}</p>{entry.photoUrl && <img src={entry.photoUrl} alt="Impact log" className="mt-3 max-h-64 rounded-lg object-cover" />}</li>)}</ul> : <p className="mt-3 rounded-xl border border-dashed border-white/15 p-5 text-sm text-white/50">No impact entries logged yet.</p>}</section>
  </TarrisPortalFrame>;
}

function ImpactStat({ label, value }: { label: string; value: string }) {
  return <article className="rounded-2xl border border-white/10 bg-[#141414] p-5"><p className="text-[10px] font-bold tracking-[0.15em] text-white/50">{label}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-2 text-[10px] text-white/40">Logged by family</p></article>;
}
