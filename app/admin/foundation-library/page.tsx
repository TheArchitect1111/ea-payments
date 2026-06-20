import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import AdminLogin from '../master/AdminLogin';

export const dynamic = 'force-dynamic';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const sections = [
  {
    title: 'Stacks',
    items: ['Simplifi to Clarifi to Magnifi to Pulse', 'Amplifi content stack', 'Mission Control partner stack'],
  },
  {
    title: 'Templates',
    items: ['Executive Transformation', 'Community Blueprint', 'University Ecosystem', 'Opportunity Experience'],
  },
  {
    title: 'Prompts',
    items: ['Research brief', 'Opportunity analysis', 'Executive summary', 'Outreach draft'],
  },
  {
    title: 'Components',
    items: ['Capture interface', 'Trust panel', 'Recommendation panel', 'Blueprint summary'],
  },
  {
    title: 'Automations',
    items: ['Analyze URL', 'Create capture record', 'Generate blueprint stub', 'Route to Mission Control'],
  },
  {
    title: 'Knowledge Vault',
    items: ['Captured records', 'Blueprint summaries', 'Recommendation history', 'Trust reasoning'],
  },
];

export default async function FoundationLibraryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section className="bg-white border border-neutral-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
          Foundation Library&trade;
        </p>
        <h2 className="text-3xl font-extrabold" style={{ color: NAVY }}>
          Reusable assets for the EA opportunity stack
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-3xl">
          This is the V1 home for reusable stacks, templates, prompts, components, automations,
          and knowledge assets used by Simplifi, Clarifi, Magnifi, and Pulse.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((section) => (
          <article key={section.title} className="bg-white border border-neutral-200 p-5">
            <h3 className="text-lg font-extrabold mb-3" style={{ color: NAVY }}>
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item} className="text-sm text-neutral-600 flex gap-2">
                  <span style={{ color: GOLD }}>*</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
