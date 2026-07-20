'use client';

import { useEffect, useState } from 'react';

const PREF_KEY = 'simplifi-due-reminders';

export function dueRemindersEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PREF_KEY) !== '0';
}

export function setDueRemindersEnabled(on: boolean) {
  window.localStorage.setItem(PREF_KEY, on ? '1' : '0');
}

/** Schedule local notifications for due/overdue items via service worker. */
export function scheduleDueReminders(
  items: Array<{ id: string; title: string; dueDate: string }>,
) {
  if (typeof window === 'undefined' || !dueRemindersEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = items.filter((i) => i.dueDate && i.dueDate <= today).slice(0, 5);
  if (dueToday.length === 0) return;

  void navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage({
      type: 'DUE_REMINDERS',
      items: dueToday.map((i) => ({
        id: i.id,
        title: i.title,
        dueDate: i.dueDate,
        href: `/simplifi/opportunity/${i.id}`,
      })),
    });
  });
}

export default function DueReminderToggle({
  dueItems,
}: {
  dueItems: Array<{ id: string; title: string; dueDate: string }>;
}) {
  const [enabled, setEnabled] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'default',
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    setEnabled(dueRemindersEnabled());
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (enabled) scheduleDueReminders(dueItems);
  }, [enabled, dueItems]);

  async function enable() {
    if (!('Notification' in window)) {
      setNote('Notifications are not supported in this browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') {
      setNote('Permission denied — reminders stay off.');
      setDueRemindersEnabled(false);
      setEnabled(false);
      return;
    }
    setDueRemindersEnabled(true);
    setEnabled(true);
    setNote('Due reminders on. We will ping when items are due today or overdue.');
    scheduleDueReminders(dueItems);
  }

  function disable() {
    setDueRemindersEnabled(false);
    setEnabled(false);
    setNote('Due reminders off.');
  }

  return (
    <div>
      <p className="sw-muted">
        Local PWA alerts for due / overdue follow-ups (this device). Status:{' '}
        {permission === 'unsupported' ? 'unsupported' : permission}
        {enabled ? ' · on' : ' · off'}
      </p>
      <div className="sw-card-actions" style={{ marginTop: 12 }}>
        {!enabled ? (
          <button type="button" className="sw-btn sw-btn-small" onClick={() => void enable()}>
            Enable due reminders
          </button>
        ) : (
          <button type="button" className="sw-btn sw-btn-small sw-btn-ghost" onClick={disable}>
            Turn off reminders
          </button>
        )}
      </div>
      {note ? <p className="sw-muted" style={{ marginTop: 8 }}>{note}</p> : null}
      <p className="sw-muted" style={{ marginTop: 12 }}>
        Capture tip: iPhone HEIC photos convert automatically when possible; otherwise use a
        screenshot or Most Compatible camera format. Keep uploads under ~3.5 MB.
      </p>
      <p className="sw-muted" style={{ marginTop: 8 }}>
        Install: Share → Add to Home Screen. Share Target opens Quick Capture for URLs and photos.
      </p>
    </div>
  );
}
