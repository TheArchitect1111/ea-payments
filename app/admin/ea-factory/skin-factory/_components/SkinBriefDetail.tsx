import type { SkinBriefRecord } from '@/lib/skin-factory';
import { skinProjectTypeLabel } from '@/lib/skin-factory';
import SkinBriefStatusBadge from './SkinBriefStatusBadge';
import { SKIN_GOLD, SKIN_NAVY } from './SkinFactoryLayout';

export default function SkinBriefDetail({ brief }: { brief: SkinBriefRecord }) {
  return (
    <article className="space-y-6">
      <header className="border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: SKIN_GOLD }}>
              Skin Brief
            </p>
            <h2 className="mt-2 text-3xl font-black" style={{ color: SKIN_NAVY }}>
              {brief.client_name}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {skinProjectTypeLabel(brief.project_type)} · {brief.organization_type}
            </p>
          </div>
          <SkinBriefStatusBadge status={brief.status} />
        </div>
        <p className="mt-4 text-sm leading-7 text-neutral-600">{brief.hero_concept}</p>
      </header>

      <Section title="Visual Story Summary" body={brief.visual_story_summary} />
      <Section title="Emotional Direction" body={brief.emotional_direction} />

      <div className="grid gap-4 md:grid-cols-2">
        <ListSection title="Color Direction" items={brief.color_direction} />
        <div className="border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
            Typography Direction
          </h3>
          <p className="mt-3 text-sm leading-7 text-neutral-600">{brief.typography_direction}</p>
        </div>
        <ListSection title="Animation Direction" items={brief.animation_direction} />
        <ListSection title="Image Requirements" items={brief.image_requirements} />
        <ListSection title="Chassis Wiring Notes" items={brief.chassis_wiring_notes} />
        <ListSection title="Module Placement Notes" items={brief.module_placement_notes} />
        <ListSection title="Mobile Experience Notes" items={brief.mobile_notes} />
        <ListSection title="Accessibility Notes" items={brief.accessibility_notes} />
      </div>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
          Section-by-Section Story Flow
        </h3>
        <div className="mt-4 space-y-3">
          {brief.section_story_flow.map((section) => (
            <div key={section.section} className="border-l-4 border-[#C9A844] bg-[#FAF8F3] p-4">
              <p className="text-sm font-black text-neutral-900">{section.section}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral-500">{section.purpose} · {section.emotion}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{section.contentNotes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
          Repo Recommendations
        </h3>
        <div className="mt-4 space-y-3">
          {brief.repo_recommendations.map((repo) => (
            <div key={repo.repoId} className="border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-neutral-900">{repo.name}</p>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">{repo.complexityLevel} complexity</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{repo.whyItFits}</p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                <strong>Suggested use:</strong> {repo.suggestedUse}
              </p>
              <p className="mt-2 text-xs text-neutral-500">Mobile: {repo.mobileImpact}</p>
              <p className="mt-1 text-xs text-neutral-500">Performance: {repo.performanceConcerns}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
          Codex Build Prompt
        </h3>
        <textarea readOnly value={brief.codex_build_prompt} className="mt-3 h-80 w-full border border-neutral-200 bg-[#FAF8F3] p-4 font-mono text-xs leading-6" />
      </section>
    </article>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600">{body}</p>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black" style={{ color: SKIN_NAVY }}>
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
