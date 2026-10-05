import { registry } from '@/lib/amanda-catherine/registry';

// Paste Amanda's Stripe Payment Links here, then deploy the preview branch.
const AMANDA_STRIPE_LINKS: Record<string, string> = {
  'lifeline-live': '',
  'clinical-fat-loss': '',
  'body-sculpt-certification': '',
  'advanced-body-sculpt': '',
  'the-entrepreneurial-artist': '',
  'foundry-mentorship': '',
};

function paymentLink(courseId: string): string | null {
  const link = AMANDA_STRIPE_LINKS[courseId]?.trim();
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' && url.hostname === 'buy.stripe.com' ? link : null;
  } catch {
    return null;
  }
}

export default async function Classes() {
  let courses: Awaited<ReturnType<typeof registry>>['courses'];
  try {
    courses = (await registry()).courses.filter(course => !course.isTest);
  } catch {
    return <section className="amanda-card"><h1>Classes</h1><p role="alert">Classes are temporarily unavailable. Please refresh shortly.</p></section>;
  }

  return <>
    <section className="amanda-card"><p className="amanda-status">LEARNING & MENTORSHIP</p><h1>Classes</h1><p>Explore your next step with Amanda.</p></section>
    <div className="amanda-grid">{courses.map(course => {
      const link = paymentLink(course.key);
      return <article className="amanda-card" key={course.key}>
        <h2>{course.title}</h2><p>{course.description}</p>
        {link ? <a className="amanda-button" href={link} target="_blank" rel="noopener noreferrer">Enroll Now</a>
          : <button className="amanda-button" type="button" disabled>Link Coming Soon</button>}
      </article>;
    })}</div>
    {!courses.length && <p>No classes are currently listed. Please check again soon.</p>}
  </>;
}
