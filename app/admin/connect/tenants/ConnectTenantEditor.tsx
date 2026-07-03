'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useState } from 'react';
import type { ConnectOrgConfig } from '@/lib/connect-store';

type Props = {
  tenant: ConnectOrgConfig;
  onUpdated: (tenant: ConnectOrgConfig) => void;
};

export default function ConnectTenantEditor({ tenant, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    name: tenant.name,
    offerHeadline: tenant.offer.headline,
    resourceTitle: tenant.offer.resourceTitle,
    guideIntro: tenant.guide.intro,
    journeyTitle: tenant.journey.title,
    journeyIntro: tenant.journey.intro,
    notificationEmails: tenant.notificationEmails.join('\n'),
    leadTypes: tenant.leadTypes.join('\n'),
    teams: tenant.teams.join('\n'),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const response = await fetch(`/api/admin/connect/tenants/${tenant.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          offerHeadline: form.offerHeadline,
          resourceTitle: form.resourceTitle,
          guideIntro: form.guideIntro,
          journeyTitle: form.journeyTitle,
          journeyIntro: form.journeyIntro,
          notificationEmails: form.notificationEmails.split('\n').map((s) => s.trim()).filter(Boolean),
          leadTypes: form.leadTypes.split('\n').map((s) => s.trim()).filter(Boolean),
          teams: form.teams.split('\n').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = (await response.json()) as { tenant?: ConnectOrgConfig; error?: string; warning?: string };
      if (!response.ok || !data.tenant) throw new Error(data.error || 'Update failed.');
      onUpdated(data.tenant);
      setStatus(data.warning ?? 'Tenant saved.');
      setOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-xs font-black uppercase tracking-[0.12em] text-neutral-700 underline"
      >
        {open ? 'Close editor' : 'Edit tenant'}
      </button>
      {open ? (
        <form onSubmit={(e) => void save(e)} className="mt-3 grid gap-3 rounded border border-neutral-200 bg-neutral-50 p-4">
          <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Name" className="min-h-10 border border-neutral-300 px-3 text-sm" />
          <input value={form.offerHeadline} onChange={(e) => setForm((c) => ({ ...c, offerHeadline: e.target.value }))} placeholder="Offer headline" className="min-h-10 border border-neutral-300 px-3 text-sm" />
          <input value={form.resourceTitle} onChange={(e) => setForm((c) => ({ ...c, resourceTitle: e.target.value }))} placeholder="Resource title" className="min-h-10 border border-neutral-300 px-3 text-sm" />
          <textarea value={form.guideIntro} onChange={(e) => setForm((c) => ({ ...c, guideIntro: e.target.value }))} placeholder="Guide intro" rows={2} className="border border-neutral-300 p-3 text-sm" />
          <input value={form.journeyTitle} onChange={(e) => setForm((c) => ({ ...c, journeyTitle: e.target.value }))} placeholder="Journey title" className="min-h-10 border border-neutral-300 px-3 text-sm" />
          <textarea value={form.journeyIntro} onChange={(e) => setForm((c) => ({ ...c, journeyIntro: e.target.value }))} placeholder="Journey intro" rows={2} className="border border-neutral-300 p-3 text-sm" />
          <textarea value={form.notificationEmails} onChange={(e) => setForm((c) => ({ ...c, notificationEmails: e.target.value }))} placeholder="Notification emails (one per line)" rows={2} className="border border-neutral-300 p-3 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea value={form.leadTypes} onChange={(e) => setForm((c) => ({ ...c, leadTypes: e.target.value }))} placeholder="Lead types" rows={3} className="border border-neutral-300 p-3 text-sm" />
            <textarea value={form.teams} onChange={(e) => setForm((c) => ({ ...c, teams: e.target.value }))} placeholder="Teams" rows={3} className="border border-neutral-300 p-3 text-sm" />
          </div>
          <button disabled={busy} className="min-h-10 w-fit bg-neutral-950 px-4 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-60">
            {busy ? 'Saving…' : 'Save tenant'}
          </button>
        </form>
      ) : null}
      {status ? <p className="mt-2 text-xs font-bold" style={{ color: GOLD }}>{status}</p> : null}
    </div>
  );
}
