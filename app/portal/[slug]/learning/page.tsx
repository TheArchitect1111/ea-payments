import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { listPublishedTrainingForTenant } from '@/lib/training-transformation-store';

export const dynamic = 'force-dynamic';

const LEARNING_LINKS = [
  {
    title: 'Simplifi guidance journeys',
    href: '/simplifi/workspace',
    note: 'Step-by-step decision intelligence for your active opportunities.',
  },
  {
    title: 'Resource library',
    href: '',
    note: 'Templates, workspace links, and tools curated for your account.',
  },
  {
    title: 'Operational MRI™ refresher',
    href: '/assessment',
    note: 'Revisit capacity assessment fundamentals and score bands.',
  },
];

export default async function LearningPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'training');
  const publishedTraining = await listPublishedTrainingForTenant(slug);

  return (
    <PortalSubpage
      slug={slug}
      active="learning"
      module="learning"
      kicker="Training Hub™"
      title="Training & learning"
      lede="Guides and modules for {members} in {workspace} — starting with the essentials below."
    >
      {publishedTraining.length ? (
        <section className="mb-8">
          <h2 className="ep-section-title">Assigned training</h2>
          <div className="ep-module-list">
            {publishedTraining.map((record) => (
              <article key={record.id} className="ep-module-card">
                <p className="ep-module-card-title">{record.title}</p>
                <p className="ep-module-card-note">{record.understanding.summary}</p>
                <div className="mt-4 grid gap-3">
                  {record.outputs
                    .filter((output) => output.publishTargets.some((target) => ['Training Hub', 'Client Portal'].includes(target)))
                    .map((output) => (
                      <details key={`${record.id}-${output.type}`} className="rounded-xl border border-neutral-200 bg-white/70 p-4">
                        <summary className="cursor-pointer text-sm font-black">{output.title}</summary>
                        <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{output.body}</pre>
                      </details>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <ul className="ep-module-list">
        {LEARNING_LINKS.map((item) => {
          const href = item.href || `/portal/${slug}/resources`;
          return (
            <li key={item.title} className="ep-module-card">
              <Link href={href} className="ep-module-card-title">
                {item.title}
              </Link>
              <p className="ep-module-card-note">{item.note}</p>
            </li>
          );
        })}
        <li className="ep-module-card">
          <p className="ep-module-card-title">Package: {client.packagePurchased}</p>
          <p className="ep-module-card-note">
            Onboarding status: {client.onboardingStatus ?? 'Not Started'} — your advisor will assign
            modules as your build progresses.
          </p>
        </li>
      </ul>
    </PortalSubpage>
  );
}
