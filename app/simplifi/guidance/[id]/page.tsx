import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { parseBlueprintSummary } from '@/lib/blueprint-summary';
import { buildGuidanceExperience } from '@/lib/simplifi-guidance-engine';
import SimplifiGuidanceV2 from './SimplifiGuidanceV2';

export const dynamic = 'force-dynamic';

export default async function SimplifiGuidancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capture = await getCaptureByIdentifier(id);
  if (!capture) notFound();

  const experience = buildGuidanceExperience(capture);
  const blueprint = parseBlueprintSummary(capture.blueprintSummary || capture.analysisSummary);
  const hasBlueprint =
    blueprint.meta.length > 0 || blueprint.sections.length > 0 || blueprint.roadmap.length > 0;

  return (
    <>
      {hasBlueprint ? (
        <section
          className="px-6 py-8 border-b border-neutral-200"
          style={{ background: '#F8F6F2' }}
          aria-label="Blueprint preview"
        >
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A844]">
              Blueprint preview
            </p>
            <h2 className="mt-2 text-xl font-black text-[#1B2B4D]">What we can build from this</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Early outline from capture — not a full delivery plan yet.
            </p>
            {blueprint.sections.slice(0, 3).map((section) => (
              <div key={section.title} className="mt-4">
                <h3 className="text-sm font-bold text-[#1B2B4D]">{section.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 whitespace-pre-wrap">
                  {section.content.slice(0, 360)}
                  {section.content.length > 360 ? '…' : ''}
                </p>
              </div>
            ))}
            <p className="mt-4 text-sm">
              <Link href={`/simplifi/opportunity/${capture.id}`} className="font-semibold underline">
                Opportunity profile
              </Link>
            </p>
          </div>
        </section>
      ) : null}
      <SimplifiGuidanceV2 experience={experience} />
    </>
  );
}
