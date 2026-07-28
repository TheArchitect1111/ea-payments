import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalNotifications } from '@/lib/notification-inbox';
import { redirectCtpClientFromExecutiveSurface } from '@/lib/ctp-executive-surface-redirect';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

export default async function PortalNotificationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await redirectCtpClientFromExecutiveSurface(slug, 'progress');
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
      kicker="Activity"
      title={CX_EMOTION.notifications.title}
      lede={CX_EMOTION.notifications.lede}
    >
      <ul className="ep-module-list">
        {notifications.length === 0 ? (
          <li className="ep-module-card">
            <p className="ep-module-card-note">{CX_EMOTION.notifications.empty}</p>
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
