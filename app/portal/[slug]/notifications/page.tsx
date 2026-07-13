import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalNotifications } from '@/lib/notification-inbox';

export const dynamic = 'force-dynamic';

export default async function PortalNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session } = await requirePortalModule(slug, 'dashboard');
  if (!session.email) {
    redirect('/portal/login');
  }

  const notifications = await listPortalNotifications({
    slug,
    email: session.email,
    limit: 50,
  });

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      module="notifications"
      kicker="Activity"
      title="Notification center"
      lede="Recent activity across {workspace} — Pulse, Simplifi, billing, and advisor updates for {members}."
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
