import type { SkinBriefStatus } from '@/lib/skin-factory';
import { SKIN_GOLD, SKIN_NAVY } from './SkinFactoryLayout';

const STATUS_STYLES: Record<SkinBriefStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  'needs-review': 'bg-amber-50 text-amber-800',
  approved: 'bg-emerald-50 text-emerald-800',
  'revision-requested': 'bg-rose-50 text-rose-800',
  archived: 'bg-neutral-200 text-neutral-600',
};

const STATUS_LABELS: Record<SkinBriefStatus, string> = {
  draft: 'Draft',
  'needs-review': 'Needs Review',
  approved: 'Approved',
  'revision-requested': 'Revision Requested',
  archived: 'Archived',
};

export default function SkinBriefStatusBadge({ status }: { status: SkinBriefStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function SkinBriefPrinciple() {
  return (
    <p className="border-l-4 bg-white p-4 text-sm leading-7 text-neutral-700" style={{ borderColor: SKIN_GOLD }}>
      <strong style={{ color: SKIN_NAVY }}>A Skin is not a template.</strong> It is the storytelling layer on top of the EA
      Chassis. The chassis provides function. The skin provides emotion, story, identity, and visual impact. Skin Factory
      does not auto-deploy and does not replace human approval.
    </p>
  );
}
