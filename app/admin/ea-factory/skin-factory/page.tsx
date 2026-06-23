'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserSkinBriefStore, summarizeSkinBriefs } from '@/lib/skin-factory-store';
import { skinProjectTypeLabel, type SkinBriefRecord } from '@/lib/skin-factory';
import FutureHooksPanel from './_components/FutureHooksPanel';
import SkinFactoryLayout from './_components/SkinFactoryLayout';
import SkinBriefStatusBadge, { SkinBriefPrinciple } from './_components/SkinBriefStatusBadge';
import { SKIN_NAVY } from './_components/SkinFactoryLayout';

export default function SkinFactoryDashboardPage() {
  const [briefs] = useState<SkinBriefRecord[]>(() => createBrowserSkinBriefStore().list());

  const stats = summarizeSkinBriefs(briefs);
  const recent = briefs.slice(0, 8);

  return (
    <SkinFactoryLayout
      title="Skin Factory™"
      subtitle="Generate cinematic, story-driven skin briefs and Codex-ready build packages. Skin Factory does not auto-deploy and does not replace human approval."
      actions={
        <Link href="/admin/ea-factory/skin-factory/new" className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
          New Skin Brief
        </Link>
      }
    >
      <div className="space-y-6">
        <SkinBriefPrinciple />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Drafts" value={stats.draft} />
          <StatCard label="Needs Review" value={stats.needsReview} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Revision" value={stats.revisionRequested} />
        </div>

        <section className="border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black" style={{ color: SKIN_NAVY }}>
              Recent Skin Briefs
            </h2>
            <Link href="/admin/ea-factory/skin-factory/briefs" className="text-xs font-black uppercase tracking-wider text-neutral-500">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              No saved briefs yet.{' '}
              <Link href="/admin/ea-factory/skin-factory/new" className="font-bold text-[#1B2B4D]">
                Create your first Skin Brief
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {recent.map((brief) => (
                <li key={brief.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/ea-factory/skin-factory/briefs/${brief.id}`} className="font-black text-neutral-900 hover:underline">
                      {brief.client_name}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {skinProjectTypeLabel(brief.project_type)} · updated {new Date(brief.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <SkinBriefStatusBadge status={brief.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <FutureHooksPanel />
      </div>
    </SkinFactoryLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-black" style={{ color: SKIN_NAVY }}>
        {value}
      </p>
    </div>
  );
}
