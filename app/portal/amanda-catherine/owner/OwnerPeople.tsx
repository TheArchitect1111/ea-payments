'use client';

import { useEffect, useState } from 'react';
import type { Person } from '@/lib/people/types';
import type { AmandaPaymentRecord } from '@/lib/amanda-catherine/payment-fulfillment';
import type { PortalFormSubmission } from '@/lib/portal-forms/types';
import type { AmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export default function OwnerPeople({ payments, applications, progress }: { payments: AmandaPaymentRecord[]; applications: PortalFormSubmission[]; progress: AmandaCourseProgress[] }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/portal/amanda-catherine/people').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 404 ? 'The durable People directory is not enabled for this portal.' : data.error || 'People could not be loaded.');
      if (active) setPeople(data.people || []);
    }).catch((cause) => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, []);
  return <section>{error ? <p role="alert">{error}</p> : null}{people.map((person) => {
    const emails = person.emails.map((item) => item.value.toLowerCase());
    const purchases = payments.filter((item) => item.personId === person.id);
    const requests = applications.filter((item) => item.payload?.personId === person.id);
    const activity = progress.filter((item) => emails.includes(item.email.toLowerCase()));
    return <article className="ac-card" key={person.id}><h2>{person.displayName}</h2><p>{emails.join(', ')} · {person.id}</p><h3>Purchases</h3>{purchases.map((item) => <p key={item.id}>{item.courseId || item.offerId || item.membershipId} · CAD ${item.amountPaidCad.toFixed(2)} · {item.paymentStatus} · {item.stripeSessionId}</p>)}<h3>Applications</h3>{requests.map((item) => <p key={item.id}>{String(item.payload?.formId)} · {item.status} · {item.id}</p>)}<h3>Learning progress</h3>{activity.map((item) => <p key={item.courseId}>{item.courseId} · {item.completedLessons.length} lessons completed · {item.certificateIssuedAt ? 'Certificate issued' : 'Certification pending'}</p>)}</article>;
  })}</section>;
}
