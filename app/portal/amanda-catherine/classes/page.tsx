import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { registry, rows } from '@/lib/amanda-catherine/registry';
import { getStripe } from '@/lib/stripe';
import FormPage from '../FormPage';

export default async function Classes({ searchParams }: { searchParams?: Promise<{course?:string;checkout?:string}> }) {
  const query = await searchParams || {};
  let data: Awaited<ReturnType<typeof registry>>;
  try { data = await registry(); }
  catch { return <section className="amanda-card"><h1>Classes</h1><p role="alert">Classes are temporarily unavailable. Please refresh shortly.</p></section>; }
  const {courses,orgId} = data;
  const course = courses.find(c => c.key === query.course && !c.isTest);
  let error = '';
  let checkoutUrl: string | null = null;
  if(query.checkout === 'true') {
    if(!course) error = 'Choose a listed course below.';
    else if(course.status !== 'READY') {
      return <><FormPage kind="enroll" course={course.key}/><p><a href="/portal/amanda-catherine/classes">Back to Classes</a></p></>;
    } else {
      try {
        const records = await rows('Creative Studio', `AND({Organization ID}='${orgId}',OR(LOWER({Record Type})='course',LOWER({Record Type})='service'))`);
        const record = records.find(r => {
          const payload = JSON.parse(r.fields['Payload JSON'] || '{}');
          return (payload.slug || r.fields['Record Key']) === course.key;
        });
        const payload = JSON.parse(record?.fields['Payload JSON'] || '{}');
        // Use the course's configured Stripe Price, never an unrelated EA package.
        if(typeof payload.stripePriceId !== 'string' || !/^price_[A-Za-z0-9]+$/.test(payload.stripePriceId)) {
          throw new Error('Checkout for this course is not yet configured.');
        }
        const requestHeaders = await headers();
        const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
        const protocol = requestHeaders.get('x-forwarded-proto') || 'https';
        if(!host || !/^[a-z0-9.:-]+$/i.test(host)) throw new Error('Unable to determine checkout return address.');
        const baseUrl = `${protocol === 'http' ? 'http' : 'https'}://${host}`;
        const session = await getStripe().checkout.sessions.create({
          mode:'payment',payment_method_types:['card'],
          line_items:[{price:payload.stripePriceId,quantity:1}],
          metadata:{portalSlug:'amanda-catherine',instructor:'amanda-catherine',courseId:course.key,packageName:course.title},
          success_url:`${baseUrl}/portal/amanda-catherine/thank-you?course=${encodeURIComponent(course.key)}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url:`${baseUrl}/portal/amanda-catherine/classes?course=${encodeURIComponent(course.key)}`,
        });
        if(!session.url) throw new Error('Unable to open secure checkout.');
        checkoutUrl = session.url;
      } catch(e) {
        console.error('[Amanda course checkout]',e);
        error = e instanceof Error && e.message === 'Checkout for this course is not yet configured.' ? e.message : 'Secure checkout is temporarily unavailable. Please try again shortly.';
      }
    }
  }
  if(checkoutUrl) redirect(checkoutUrl);
  return <><section className="amanda-card"><p className="amanda-status">LEARNING & MENTORSHIP</p><h1>Classes</h1><p>Explore your next step with Amanda.</p>{error && <p role="alert" className="amanda-alert">{error}</p>}</section>
    <div className="amanda-grid">{courses.filter(c => !c.isTest).map(c => <article className="amanda-card" key={c.key}>
      <p className="amanda-status">{c.status === 'READY' ? 'ENROLLMENT OPEN' : 'COMING SOON'}</p><h2>{c.title}</h2><p>{c.description}</p>
      <a className="amanda-button" href={`/portal/amanda-catherine/classes?course=${encodeURIComponent(c.key)}&checkout=true`}>{c.status === 'READY' ? 'Enroll' : 'Join Waitlist'}</a>
    </article>)}</div>{!courses.filter(c => !c.isTest).length && <p>No classes are currently listed. Please check again soon.</p>}</>;
}
