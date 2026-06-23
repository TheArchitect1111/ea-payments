'use client';

import { useRouter } from 'next/navigation';
import { createBrowserSkinBriefStore } from '@/lib/skin-factory-store';
import type { SkinBriefRecord } from '@/lib/skin-factory';
import SkinBriefForm from '../_components/SkinBriefForm';
import SkinFactoryLayout from '../_components/SkinFactoryLayout';
import { SkinBriefPrinciple } from '../_components/SkinBriefStatusBadge';

export default function NewSkinBriefPage() {
  const router = useRouter();

  function handleGenerate(brief: SkinBriefRecord) {
    const store = createBrowserSkinBriefStore();
    const saved = store.save({ ...brief, status: 'needs-review' });
    router.push(`/admin/ea-factory/skin-factory/briefs/${saved.id}`);
  }

  return (
    <SkinFactoryLayout
      title="New Skin Brief™"
      subtitle="Enter client and project context. Skin Factory will generate cinematic creative direction, chassis wiring notes, and a Codex-ready build prompt."
    >
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <SkinBriefForm submitLabel="Generate Skin Brief" onSubmit={handleGenerate} />
        <div className="space-y-4">
          <SkinBriefPrinciple />
          <section className="border border-neutral-200 bg-white p-5 text-sm leading-7 text-neutral-600 shadow-sm">
            <p className="font-black text-neutral-900">What you get</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Visual story summary and emotional direction</li>
              <li>Hero concept and section-by-section story flow</li>
              <li>Image, color, typography, and motion direction</li>
              <li>Repo recommendations from Repo Library™</li>
              <li>Chassis wiring and module placement notes</li>
              <li>Mobile and accessibility guidance</li>
              <li>Codex build prompt (export after approval)</li>
            </ul>
          </section>
        </div>
      </div>
    </SkinFactoryLayout>
  );
}
