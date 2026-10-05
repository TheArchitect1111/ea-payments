import Script from 'next/script';
import { registry } from '@/lib/amanda-catherine/registry';

const checkoutScript = `
(() => {
  const form = document.getElementById('amanda-checkout-form');
  if (!form || form.dataset.wired) return;
  form.dataset.wired = 'true';
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const error = document.getElementById('amanda-checkout-error');
    const fields = new FormData(form);
    const courseId = String(fields.get('course') || '');
    button.disabled = true; error.textContent = '';
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: fields.get('name'), email: fields.get('email'), packageId: courseId, course: courseId, instructor: 'amanda-catherine'})
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is temporarily unavailable.');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout destination.');
      window.location.href = data.url;
    } catch (e) {
      error.textContent = e.message || 'Unable to open checkout.'; button.disabled = false;
    }
  });
})();`;

export default async function Classes({searchParams}:{searchParams?:Promise<{course?:string;checkout?:string}>}) {
  const query = await searchParams || {};
  let courses: Awaited<ReturnType<typeof registry>>['courses'];
  try { courses = (await registry()).courses.filter(c => !c.isTest); }
  catch { return <section className="amanda-card"><h1>Classes</h1><p role="alert">Classes are temporarily unavailable. Please refresh shortly.</p></section>; }
  const selected = courses.find(c => c.key === query.course);
  if (selected && query.checkout === 'true') return <section className="amanda-card amanda-form">
    <p className="amanda-status">SECURE CHECKOUT</p><h1>{selected.title}</h1><p>Enter your details to continue to Stripe’s secure payment page.</p>
    <form id="amanda-checkout-form" action="/api/checkout" method="POST">
      <input type="hidden" name="course" value={selected.key}/>
      <label htmlFor="amanda-checkout-name">Full Name<input id="amanda-checkout-name" name="name" autoComplete="name" required maxLength={200}/></label>
      <label htmlFor="amanda-checkout-email">Email<input id="amanda-checkout-email" name="email" type="email" autoComplete="email" required/></label>
      <p id="amanda-checkout-error" role="alert" className="amanda-alert" aria-live="polite"/>
      <button className="amanda-button" type="submit">Continue to Stripe Checkout</button>
    </form><p><a href="/portal/amanda-catherine/classes">Back to Classes</a></p>
    <Script id="amanda-course-checkout" strategy="afterInteractive" dangerouslySetInnerHTML={{__html:checkoutScript}}/>
  </section>;
  return <><section className="amanda-card"><p className="amanda-status">LEARNING & MENTORSHIP</p><h1>Classes</h1><p>Explore your next step with Amanda.</p>{query.checkout === 'true' && !selected && <p role="alert">Choose a listed course below.</p>}</section>
    <div className="amanda-grid">{courses.map(c => <article className="amanda-card" key={c.key}><h2>{c.title}</h2><p>{c.description}</p><a className="amanda-button" href={`/portal/amanda-catherine/classes?course=${encodeURIComponent(c.key)}&checkout=true`}>Enroll</a></article>)}</div>
    {!courses.length && <p>No classes are currently listed. Please check again soon.</p>}</>;
}
