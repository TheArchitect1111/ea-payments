'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createBrowserSkinBriefStore } from '@/lib/skin-factory-store';
import {
  SKIN_DESIGN_RULES,
  buildSkinExportPackage,
  canExportSkinBrief,
  skinProjectTypeLabel,
  type SkinBriefRecord,
} from '@/lib/skin-factory';
import SkinFactoryLayout from '../../../_components/SkinFactoryLayout';
import SkinBriefStatusBadge from '../../../_components/SkinBriefStatusBadge';

export default function SkinBriefExportPage() {
  const params = useParams<{ id: string }>();
  const [brief] = useState<SkinBriefRecord | null>(() => createBrowserSkinBriefStore().get(params.id));
  const [exportDraft, setExportDraft] = useState(false);

  const exportState = useMemo(() => {
    if (!brief) {
      return { pkg: null, error: '' };
    }
    if (!canExportSkinBrief(brief.status, exportDraft)) {
      return {
        pkg: null,
        error: exportDraft
          ? 'Unable to build draft export.'
          : 'Approve this Skin Brief or choose Export Draft to continue.',
      };
    }
    try {
      return { pkg: buildSkinExportPackage(brief, exportDraft), error: '' };
    } catch (err) {
      return { pkg: null, error: err instanceof Error ? err.message : 'Export blocked.' };
    }
  }, [brief, exportDraft]);

  const { pkg, error } = exportState;

  function downloadJson() {
    if (!pkg || !brief) return;
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${brief.client_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-skin-build-package.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function copyPrompt() {
    if (!pkg) return;
    void navigator.clipboard.writeText(pkg.codexBuildPrompt);
  }

  if (!brief) {
    return (
      <SkinFactoryLayout title="Export unavailable" subtitle="Skin Brief not found in this browser workspace.">
        <Link href="/admin/ea-factory/skin-factory/briefs" className="text-sm font-bold text-[#1B2B4D]">
          Back to saved briefs
        </Link>
      </SkinFactoryLayout>
    );
  }

  return (
    <SkinFactoryLayout
      title="Export Build Package™"
      subtitle={`Codex-ready package for ${brief.client_name} — ${skinProjectTypeLabel(brief.project_type)}`}
      actions={
        <Link href={`/admin/ea-factory/skin-factory/briefs/${brief.id}`} className="border border-neutral-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider">
          Back to brief
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SkinBriefStatusBadge status={brief.status} />
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input type="checkbox" checked={exportDraft} onChange={(event) => setExportDraft(event.target.checked)} />
          Export as draft (bypass approval gate)
        </label>
      </div>

      {error ? <p className="mb-4 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p> : null}

      {pkg ? (
        <div className="space-y-6">
          <section className="border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadJson} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
                Download JSON Package
              </button>
              <button type="button" onClick={copyPrompt} className="border border-neutral-200 px-4 py-2 text-xs font-black uppercase tracking-wider">
                Copy Codex Prompt
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Export mode</dt>
                <dd className="font-semibold text-neutral-900">{pkg.exportMode}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Generated</dt>
                <dd className="font-semibold text-neutral-900">{new Date(pkg.generatedAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Protocols</dt>
                <dd className="text-neutral-700">{pkg.protocols.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">Repositories</dt>
                <dd className="text-neutral-700">{pkg.repositories.join(', ')}</dd>
              </div>
            </dl>
          </section>

          <ListBlock title="Design rules" items={SKIN_DESIGN_RULES} />
          <ListBlock title="Build requirements" items={pkg.buildRequirements} />
          <ListBlock title="Chassis modules" items={pkg.chassisModules} />

          <section className="border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#1B2B4D]">Codex build prompt</h3>
            <textarea readOnly value={pkg.codexBuildPrompt} className="mt-3 h-[28rem] w-full border border-neutral-200 bg-[#FAF8F3] p-4 font-mono text-xs leading-6" />
          </section>
        </div>
      ) : null}
    </SkinFactoryLayout>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#1B2B4D]">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
