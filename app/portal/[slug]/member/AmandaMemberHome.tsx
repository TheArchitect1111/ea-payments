import Link from 'next/link';
import type { PlatformRole } from '@/lib/rbac';
import { AMANDA_ROLE_DASHBOARDS } from '@/lib/amanda-catherine/config';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';

const DESTINATIONS: Array<[string[], string]> = [
  [['course', 'training', 'assessment', 'progress', 'certif'], 'learning'],
  [['appointment', 'schedule'], 'calendar'],
  [['event'], 'events'],
  [['form', 'consent', 'application', 'onboarding'], 'intake'],
  [['document', 'asset', 'media', 'template', 'protocol'], 'documents'],
  [['payment', 'receipt', 'tuition', 'invoice', 'package', 'membership', 'product'], 'billing'],
  [['message', 'announcement'], 'messaging'],
  [['report', 'lead', 'crm', 'people', 'referral', 'directory'], 'reports'],
  [['resource', 'policy'], 'resources'],
];

function hrefFor(slug: string, item: string) {
  const key = item.toLowerCase();
  const match = DESTINATIONS.find(([needles]) => needles.some((needle) => key.includes(needle)));
  return `/portal/${slug}/${match?.[1] || 'member'}`;
}

function label(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function AmandaMemberHome({
  slug,
  email,
  role,
}: {
  slug: string;
  email: string;
  role?: PlatformRole;
}) {
  const audience = await resolveAmandaAudience({ portalSlug: slug, email, role });
  const items = AMANDA_ROLE_DASHBOARDS[audience];
  const audienceLabel = label(audience);

  return (
    <>
      <div className="ep-module-card" style={{ marginBottom: 18 }}>
        <p className="ep-module-card-title">Your Amanda Catherine workspace</p>
        <p className="ep-module-card-note">
          {audienceLabel} view · the portal adapts to the work, enrollment, and applications connected to {email}.
        </p>
      </div>
      <ul className="ep-module-list">
        {items.map((item) => (
          <li key={item} className="ep-module-card">
            <Link href={hrefFor(slug, item)} className="ep-module-card-title">
              {label(item)}
            </Link>
            <p className="ep-module-card-note">Open this part of your Amanda Catherine path.</p>
          </li>
        ))}
      </ul>
    </>
  );
}
