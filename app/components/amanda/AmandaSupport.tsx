import Link from 'next/link';
import { AMANDA_SUPPORT_WORDING, amandaSupportWindow } from '@/lib/amanda-catherine/lms-policy';
export default function AmandaSupport({ trainingDate, email, bookingUrl }: { trainingDate?: string; email: string; bookingUrl: string }) {
  const approvedBookingUrl = bookingUrl.startsWith('https://') ? bookingUrl : '';
  const window = amandaSupportWindow(trainingDate);
  return <section className="ep-module-card" aria-labelledby="amanda-support-heading"><h2 id="amanda-support-heading">Support &amp; mentorship</h2><p>{AMANDA_SUPPORT_WORDING}</p>
    <p>{window ? `Class/training date: ${window.startsOn}. Support ends: ${window.endsOn}. ${window.status === 'scheduled' ? 'Begins on your training date.' : window.status === 'ended' ? 'Your 90-day period has ended.' : `${window.daysRemaining} days remaining.`}` : 'The 90 days begin on your class/training date. Your class/training date has not been recorded yet.'}</p>
    <p><Link href="/portal/amanda-catherine/messaging">Portal communication</Link></p><p><a href={`mailto:${email}`}>Email Amanda</a></p><p>{approvedBookingUrl ? <a href={approvedBookingUrl} target="_blank" rel="noopener noreferrer">Schedule Mentorship Call</a> : 'Contact Amanda through the portal or email to schedule mentorship calls.'}</p>
  </section>;
}
