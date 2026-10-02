import Link from 'next/link';
import { useId } from 'react';
import { AMANDA_SUPPORT_WORDING, amandaSupportWindow } from '@/lib/amanda-catherine/lms-policy';
export default function AmandaSupport({ trainingDate, email, bookingUrl }: { trainingDate?: string; email: string; bookingUrl: string }) {
  const headingId = useId();
  let approvedBookingUrl = '';
  try {
    const url = new URL(bookingUrl);
    if (url.protocol === 'https:' && !url.username && !url.password) approvedBookingUrl = url.href;
  } catch { /* Invalid configuration leaves scheduling unavailable. */ }
  const window = amandaSupportWindow(trainingDate);
  return <section className="ep-module-card" aria-labelledby={headingId}><h2 id={headingId}>Support &amp; mentorship</h2><p>{AMANDA_SUPPORT_WORDING}</p>
    <p>{window ? `Class/training date: ${window.startsOn}. Support ends: ${window.endsOn}. ${window.status === 'scheduled' ? 'Begins on your training date.' : window.status === 'ended' ? 'Your 90-day period has ended.' : `${window.daysRemaining} days remaining.`}` : 'The 90 days begin on your class/training date. Your class/training date has not been recorded yet.'}</p>
    <p><Link href="/portal/amanda-catherine/messaging">Portal communication</Link></p><p><a href={`mailto:${email}`}>Email Amanda via Gmail</a></p><p>{approvedBookingUrl ? <a href={approvedBookingUrl} target="_blank" rel="noopener noreferrer">Schedule Mentorship Call</a> : 'Contact Amanda through the portal or email to schedule mentorship calls.'}</p>
  </section>;
}
