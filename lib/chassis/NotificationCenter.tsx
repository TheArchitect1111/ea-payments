'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type PortalNotification = {
  id: string;
  at: string;
  title: string;
  detail?: string;
  href?: string;
  priority?: string;
  read: boolean;
};

export function NotificationCenter({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/notifications');
      const data = (await res.json()) as {
        notifications?: PortalNotification[];
        unreadCount?: number;
      };
      if (res.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markAllRead() {
    await fetch('/api/portal/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    await load();
  }

  return (
    <div className="ea-notify">
      <button
        type="button"
        className="ea-notify-trigger"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 ? <span className="ea-notify-badge">{unreadCount}</span> : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="ea-notify-backdrop"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="ea-notify-panel" role="dialog" aria-label="Notification center">
            <div className="ea-notify-panel-head">
              <p className="ea-notify-panel-title">Notifications</p>
              <button type="button" className="ea-notify-mark-read" onClick={() => void markAllRead()}>
                Mark all read
              </button>
            </div>

            {loading && notifications.length === 0 ? (
              <p className="ea-notify-empty">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="ea-notify-empty">You&apos;re all caught up.</p>
            ) : (
              <ul className="ea-notify-list">
                {notifications.map((item) => (
                  <li key={item.id} className={`ea-notify-item${item.read ? '' : ' ea-notify-item-unread'}`}>
                    {item.href ? (
                      <Link href={item.href} className="ea-notify-item-link" onClick={() => setOpen(false)}>
                        <span className="ea-notify-item-title">{item.title}</span>
                        {item.detail ? <span className="ea-notify-item-detail">{item.detail}</span> : null}
                        <time className="ea-notify-item-time">
                          {new Date(item.at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </time>
                      </Link>
                    ) : (
                      <div className="ea-notify-item-link">
                        <span className="ea-notify-item-title">{item.title}</span>
                        {item.detail ? <span className="ea-notify-item-detail">{item.detail}</span> : null}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <Link href={`/portal/${slug}/notifications`} className="ea-notify-view-all" onClick={() => setOpen(false)}>
              View all activity
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
