import Link from 'next/link';
import { NAVY, GOLD } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function AskAdvisorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requirePortalModule(slug, 'ask');

  return (
    <PortalSubpage
      slug={slug}
      active="ask"
      kicker="Guide™"
      title="Ask your advisor"
      lede="Submit a question and our team will respond through your Update Hub activity feed."
    >
      <div className="ep-module-card" style={{ maxWidth: '36rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '1rem' }}>
          For detailed requests, use the message form — it creates a tracked update in your portal.
        </p>
        <Link
          href={`/portal/${slug}/updates/new`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Open message form
        </Link>
      </div>
    </PortalSubpage>
  );
}
