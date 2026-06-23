'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createBrowserSkinBriefStore } from '@/lib/skin-factory-store';
import { skinProjectTypeLabel, type SkinBriefRecord } from '@/lib/skin-factory';
import SkinFactoryLayout from '../_components/SkinFactoryLayout';
import SkinBriefStatusBadge from '../_components/SkinBriefStatusBadge';
import { SKIN_NAVY } from '../_components/SkinFactoryLayout';

export default function SavedSkinBriefsPage() {
  const [briefs] = useState<SkinBriefRecord[]>(() => createBrowserSkinBriefStore().list());

  return (
    <SkinFactoryLayout
      title="Saved Skin Briefs™"
      subtitle="Review, approve, and export cinematic skin direction packages. Build and export require approval unless explicitly exported as draft."
      actions={
        <Link href="/admin/ea-factory/skin-factory/new" className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
          New Skin Brief
        </Link>
      }
    >
      {briefs.length === 0 ? (
        <p className="border border-dashed border-neutral-300 bg-white p-8 text-sm leading-7 text-neutral-600">
          No saved briefs in this browser workspace yet.
        </p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs font-black uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {briefs.map((brief) => (
                <tr key={brief.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-semibold text-neutral-900">{brief.client_name}</td>
                  <td className="px-4 py-3 text-neutral-600">{skinProjectTypeLabel(brief.project_type)}</td>
                  <td className="px-4 py-3">
                    <SkinBriefStatusBadge status={brief.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(brief.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/ea-factory/skin-factory/briefs/${brief.id}`} className="font-black" style={{ color: SKIN_NAVY }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SkinFactoryLayout>
  );
}
