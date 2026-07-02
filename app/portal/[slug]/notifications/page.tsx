import Link from 'next/link';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalNotifications } from '@/lib/notification-inbox';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PortalNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requirePortalModule(slug, 'dashboard');

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session?.email) redirect('/portal/login');

  const notifications = await listPortalNotifications({
    slug,
    email: session.email,
    limit: 50,
  });

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      kicker="Activity"
      title="Notification center"
      lede="Recent activity across Pulse, Simplifi, billing, and your advisor updates."
    >
      <ul className="ep-module-list">
        {notifications.length === 0 ? (
          <li className="ep-module-card">
            <p className="ep-module-card-note">No recent activity yet.</p>
          </li>
        ) : (
          notifications.map((item) => (
            <li key={item.id} className="ep-module-card">
              {item.href ? (
                <Link href={item.href} className="ep-module-card-title">
                  {item.title}
                </Link>
              ) : (
                <p className="ep-module-card-title">{item.title}</p>
              )}
              {item.detail ? <p className="ep-module-card-note">{item.detail}</p> : null}
              <p className="ep-module-card-note">
                {new Date(item.at).toLocaleString()}
                {!item.read ? ' · Unread' : ''}
              </p>
            </li>
          ))
        )}
      </ul>
    </PortalSubpage>
  );
}
