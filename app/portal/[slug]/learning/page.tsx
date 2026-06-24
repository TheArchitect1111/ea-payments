import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

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
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/learning`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

  return (
    <PortalSubpage
      slug={slug}
      active="learning"
      kicker="Training Hub™"
      title="Training & learning"
      lede="Guides, modules, and resources to support adoption — starting with the essentials below."
    >
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
