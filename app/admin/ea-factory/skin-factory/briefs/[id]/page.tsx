'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { createBrowserSkinBriefStore } from '@/lib/skin-factory-store';
import {
  buildSkinExportPackage,
  canExportSkinBrief,
  generateSkinBrief,
  type SkinBriefRecord,
} from '@/lib/skin-factory';
import SkinBriefDetail from '../../_components/SkinBriefDetail';
import SkinBriefForm, { recordToFormState } from '../../_components/SkinBriefForm';
import SkinFactoryLayout from '../../_components/SkinFactoryLayout';
import SkinBriefStatusBadge from '../../_components/SkinBriefStatusBadge';

export default function SkinBriefDetailPage() {
  const params = useParams<{ id: string }>();
  const [brief, setBrief] = useState<SkinBriefRecord | null>(() => createBrowserSkinBriefStore().get(params.id));
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  function updateBrief(patch: Partial<SkinBriefRecord>) {
    const store = createBrowserSkinBriefStore();
    const next = store.update(params.id, patch);
    if (next) setBrief(next);
    return next;
  }

  function handleRegenerate(inputBrief: SkinBriefRecord) {
    const regenerated = generateSkinBrief(
      {
        client_name: inputBrief.client_name,
        organization_type: inputBrief.organization_type,
        website_social_url: inputBrief.website_social_url,
        mission: inputBrief.mission,
        audience: inputBrief.audience,
        primary_goal: inputBrief.primary_goal,
        desired_emotion: inputBrief.desired_emotion,
        transformation_promise: inputBrief.transformation_promise,
        project_type: inputBrief.project_type,
        selected_protocol: inputBrief.selected_protocol,
        selected_repos: inputBrief.selected_repos,
        chassis_modules: inputBrief.chassis_modules,
        brand_colors: inputBrief.brand_colors,
        assets: inputBrief.assets,
        notes: inputBrief.notes,
      },
      {
        id: inputBrief.id,
        status: 'needs-review',
        created_at: inputBrief.created_at,
        approved_at: null,
        approved_by: null,
      },
    );
    const saved = updateBrief(regenerated);
    if (saved) {
      setEditing(false);
      setMessage('Skin Brief regenerated and set to Needs Review.');
    }
  }

  function handleEditSubmit(nextBrief: SkinBriefRecord) {
    const saved = updateBrief({ ...nextBrief, status: 'needs-review', approved_at: null, approved_by: null });
    if (saved) {
      setEditing(false);
      setMessage('Changes saved. Status set to Needs Review.');
    }
  }

  function handleApprove() {
    const saved = updateBrief({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: 'EA Admin',
    });
    if (saved) setMessage('Skin Brief approved. Export is now enabled.');
  }

  function handleRevision() {
    const saved = updateBrief({ status: 'revision-requested', approved_at: null, approved_by: null });
    if (saved) setMessage('Revision requested.');
  }

  function handleArchive() {
    const saved = updateBrief({ status: 'archived' });
    if (saved) setMessage('Brief archived.');
  }

  function downloadExport(exportDraft: boolean) {
    if (!brief) return;
    try {
      const pkg = buildSkinExportPackage(brief, exportDraft);
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${brief.client_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-skin-build-package.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(exportDraft ? 'Draft export downloaded.' : 'Approved build package downloaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export blocked.');
    }
  }

  if (!brief) {
    return (
      <SkinFactoryLayout title="Skin Brief not found" subtitle="This brief may have been removed from the browser workspace.">
        <Link href="/admin/ea-factory/skin-factory/briefs" className="text-sm font-bold text-[#1B2B4D]">
          Back to saved briefs
        </Link>
      </SkinFactoryLayout>
    );
  }

  const exportAllowed = canExportSkinBrief(brief.status);

  return (
    <SkinFactoryLayout
      title={brief.client_name}
      subtitle="Review cinematic skin direction, approve for build, and export a Codex-ready package."
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing((value) => !value)} className="border border-neutral-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider">
            {editing ? 'Cancel Edit' : 'Edit'}
          </button>
          <button type="button" onClick={() => handleRegenerate(brief)} className="border border-neutral-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider">
            Regenerate
          </button>
          <button type="button" onClick={handleRevision} className="border border-neutral-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider">
            Request Revision
          </button>
          <button type="button" onClick={handleApprove} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">
            Approve
          </button>
          <Link href={`/admin/ea-factory/skin-factory/briefs/${brief.id}/export`} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
            Export Package
          </Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SkinBriefStatusBadge status={brief.status} />
        {brief.approved_at ? (
          <p className="text-xs text-neutral-500">
            Approved {new Date(brief.approved_at).toLocaleString()} by {brief.approved_by ?? 'EA Admin'}
          </p>
        ) : null}
        {message ? <p className="text-xs font-bold text-neutral-600">{message}</p> : null}
      </div>

      {editing ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <SkinBriefForm
            initial={recordToFormState(brief)}
            initialAssets={brief.assets}
            submitLabel="Save & Regenerate Brief"
            onSubmit={handleEditSubmit}
          />
          <SkinBriefDetail brief={brief} />
        </div>
      ) : (
        <SkinBriefDetail brief={brief} />
      )}

      <section className="mt-8 border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black text-[#1B2B4D]">Export controls</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Build packages export only when status is <strong>Approved</strong>, unless you explicitly export a draft for internal review.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!exportAllowed}
            onClick={() => downloadExport(false)}
            className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-40"
          >
            Export Approved Package
          </button>
          <button type="button" onClick={() => downloadExport(true)} className="border border-neutral-200 px-4 py-2 text-xs font-black uppercase tracking-wider">
            Export Draft Package
          </button>
          <button type="button" onClick={handleArchive} className="border border-neutral-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-500">
            Archive
          </button>
        </div>
      </section>
    </SkinFactoryLayout>
  );
}
