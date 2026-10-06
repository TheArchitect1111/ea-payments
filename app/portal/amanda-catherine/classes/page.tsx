import { registry } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      const checkoutUrl = course.square_checkout_url;
      const enrollUrl = checkoutUrl || `/portal/amanda-catherine/enroll?course=${encodeURIComponent(course.key)}`;
      return <article className="amanda-card" key={course.key}>
        <h2>{course.title}</h2><p>{course.description}</p>
        <a className="amanda-button" href={enrollUrl}
          {...(checkoutUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>Enroll Now</a>
      </article>;
    })}</div>
    {!courses.length && <p>No classes are currently listed. Please check again soon.</p>}
  </>;
}
