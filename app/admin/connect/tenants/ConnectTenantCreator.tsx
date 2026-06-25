'use client';

import { useEffect, useState } from 'react';
import type { ConnectOrgConfig } from '@/lib/connect-store';

type Props = {
  initialTenants: ConnectOrgConfig[];
  initialSystemStatus: ConnectSystemStatus;
};

type CreateResult = {
  tenant: ConnectOrgConfig;
  persisted: boolean;
  storage: 'airtable' | 'memory';
  warning?: string;
};

type ConnectSystemStatus = {
  ready: boolean;
  score: number;
  checks: Array<{
    ok: boolean;
    label: string;
    detail: string;
  }>;
};

const GOLD = '#c9a844';

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ConnectTenantCreator({ initialTenants, initialSystemStatus }: Props) {
  const [tenants, setTenants] = useState(initialTenants);
  const [systemStatus, setSystemStatus] = useState(initialSystemStatus);
  const [status, setStatus] = useState<string>('');
  const [created, setCreated] = useState<CreateResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const [defaultSlug, setDefaultSlug] = useState('');

  useEffect(() => {
    setDefaultSlug(`tenant-${Math.floor(Date.now() / 1000)}`);
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setStatus('');
    setCreated(null);

    const payload = {
      slug: String(formData.get('slug') || ''),
      name: String(formData.get('name') || ''),
      offerHeadline: String(formData.get('offerHeadline') || ''),
      resourceTitle: String(formData.get('resourceTitle') || ''),
      accent: String(formData.get('accent') || ''),
      notificationEmails: splitLines(String(formData.get('notificationEmails') || '')),
      leadTypes: splitLines(String(formData.get('leadTypes') || '')),
      teams: splitLines(String(formData.get('teams') || '')),
      guideTitle: String(formData.get('guideTitle') || ''),
      guideIntro: String(formData.get('guideIntro') || ''),
      journeyTitle: String(formData.get('journeyTitle') || ''),
      journeyIntro: String(formData.get('journeyIntro') || ''),
    };

    try {
      const response = await fetch('/api/admin/connect/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tenant creation failed.');

      setCreated(data);
      setTenants((current) => [data.tenant, ...current.filter((tenant) => tenant.slug !== data.tenant.slug)]);
      setStatus(data.persisted ? 'Tenant created and saved.' : data.warning || 'Tenant created.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Tenant creation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetupStorage() {
    setIsSettingUp(true);
    setStatus('');

    try {
      const response = await fetch('/api/admin/connect/setup', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connect setup failed.');
      setSystemStatus(data.status);
      setStatus(data.setup?.ok ? 'Connect tenant storage is ready.' : data.setup?.error || 'Connect setup returned a warning.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Connect setup failed.');
    } finally {
      setIsSettingUp(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="border border-neutral-200 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Create Tenant</p>
        <h2 className="mt-2 text-2xl font-black">Duplicate Connect for a new client</h2>

        <form action={handleSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Client Name
              <input name="name" required placeholder="Coalition Community Network" className="min-h-11 border border-neutral-300 px-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Slug
              <input name="slug" required defaultValue={defaultSlug} placeholder="coalition" className="min-h-11 border border-neutral-300 px-3 font-normal" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
            <label className="grid gap-2 text-sm font-bold">
              Offer Headline
              <input name="offerHeadline" required placeholder="Get the Community Welcome Kit" className="min-h-11 border border-neutral-300 px-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Accent
              <input name="accent" defaultValue="#c9a844" className="min-h-11 border border-neutral-300 px-3 font-normal" />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-bold">
            First Resource Title
            <input name="resourceTitle" required placeholder="Community Welcome Kit" className="min-h-11 border border-neutral-300 px-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Notification Emails
            <textarea name="notificationEmails" rows={2} defaultValue="freedom@efficiencyarchitects.online" className="border border-neutral-300 p-3 font-normal" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Lead Types
              <textarea name="leadTypes" rows={4} defaultValue={'Prospect\nMember\nDonor\nVolunteer\nPartner'} className="border border-neutral-300 p-3 font-normal" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Teams
              <textarea name="teams" rows={4} defaultValue={'Relationship Team\nGrowth Team\nSupport Team'} className="border border-neutral-300 p-3 font-normal" />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-bold">
            Guide Title
            <input name="guideTitle" placeholder="Leave blank to use resource title" className="min-h-11 border border-neutral-300 px-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Guide Intro
            <textarea name="guideIntro" rows={3} placeholder="Short explanation of the promised resource." className="border border-neutral-300 p-3 font-normal" />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Journey Title
            <input name="journeyTitle" placeholder="Your next step is ready." className="min-h-11 border border-neutral-300 px-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Journey Intro
            <textarea name="journeyIntro" rows={3} placeholder="What they should do after receiving the first resource." className="border border-neutral-300 p-3 font-normal" />
          </label>

          <button disabled={isSaving} className="min-h-12 bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60">
            {isSaving ? 'Creating...' : 'Create Connect Tenant'}
          </button>
          {status ? <p className="text-sm font-bold text-neutral-700">{status}</p> : null}
        </form>
      </section>

      <section className="grid gap-5">
        <div className="border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Production Wiring</p>
              <h2 className="mt-2 text-2xl font-black">{systemStatus.score}% ready</h2>
            </div>
            <button
              type="button"
              onClick={handleSetupStorage}
              disabled={isSettingUp}
              className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
            >
              {isSettingUp ? 'Setting Up...' : 'Setup Storage'}
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {systemStatus.checks.map((check) => (
              <div key={check.label} className="border-t border-neutral-100 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{check.label}</p>
                  <span className={check.ok ? 'text-emerald-700' : 'text-red-700'} style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
                    {check.ok ? 'Ready' : 'Needs Setup'}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-neutral-500">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {created ? (
          <div className="border border-neutral-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Created</p>
            <h2 className="mt-2 text-2xl font-black">{created.tenant.name}</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <a className="font-black text-neutral-950 underline" href={`/connect/${created.tenant.slug}`}>/connect/{created.tenant.slug}</a>
              <a className="font-black text-neutral-950 underline" href={`/connect/${created.tenant.slug}/guide`}>/connect/{created.tenant.slug}/guide</a>
              <a className="font-black text-neutral-950 underline" href={`/connect/${created.tenant.slug}/journey`}>/connect/{created.tenant.slug}/journey</a>
            </div>
            <p className="mt-4 text-sm text-neutral-500">Storage: {created.storage}{created.persisted ? ' persisted' : ' temporary'}</p>
          </div>
        ) : null}

        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Registry</p>
          <h2 className="mt-2 text-2xl font-black">Connect tenants</h2>
          <div className="mt-5 grid gap-3">
            {tenants.map((tenant) => (
              <article key={tenant.slug} className="border-t border-neutral-100 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{tenant.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">/connect/{tenant.slug}</p>
                  </div>
                  <div className="flex gap-2 text-xs font-black uppercase tracking-[0.12em]">
                    <a href={`/connect/${tenant.slug}`} className="border border-neutral-200 px-3 py-2">Capture</a>
                    <a href={`/connect/${tenant.slug}/guide`} className="border border-neutral-200 px-3 py-2">Guide</a>
                    <a href={`/connect/${tenant.slug}/journey`} className="border border-neutral-200 px-3 py-2">Journey</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
