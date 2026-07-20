'use client';

import { useEffect } from 'react';
import { scheduleDueReminders } from '../components/DueReminderClient';

export default function FollowUpsReminderMount({
  items,
}: {
  items: Array<{ id: string; title: string; dueDate: string }>;
}) {
  useEffect(() => {
    scheduleDueReminders(items);
  }, [items]);
  return null;
}
