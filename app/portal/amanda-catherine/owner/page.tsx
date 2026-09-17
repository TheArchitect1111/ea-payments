import Image from 'next/image';
import Link from 'next/link';
import { AMANDA_CANONICAL_ACADEMY_COURSES } from '@/lib/amanda-catherine/canonical-courses';
import { getAmandaOwnerInsights } from '@/lib/amanda-catherine/insights';

const actions = [
  ['Appointments', 'Jane schedule', '/portal/amanda-catherine/owner/appointments'],
  ['Clients', 'People & access', '/portal/amanda-catherine/owner/clients'],
  ['Academy', 'Courses & learners', '/portal/amanda-catherine/owner/academy'],
  ['Documents', 'Files & certificates', '/portal/amanda-catherine/owner/documents'],
  ['Messages', 'Student communication', '/portal/amanda-catherine/owner/messages'],
  ['Update Hub', 'Request a change', '/portal/amanda-catherine/owner/updates'],
  ['Ask Eva', 'Business assistant', '/portal/amanda-catherine/owner/eva'],
] as const;

export const metadata = { title: 'Amanda Catherine · Owner Portal' };
const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

export default async function AmandaOwnerDashboard() {
 const insights=await getAmandaOwnerInsights();
 return <div className="ac-dashboard">
  <header className="ac-topbar"><div><small>AESTHETIKINE STUDIO LAB</small><h1>Welcome, Amanda.</h1><p>One calm workspace for your studio, academy, creative work and business.</p></div><div className="ac-status">Owner Portal · Active</div></header>
  <section className="ac-hero"><div className="ac-hero-copy"><span className="ac-kicker">YOUR WORKSPACE</span><h2>Everything important, in one place.</h2><p>Manage the day, support your students, see what needs attention and ask Eva for help without jumping between disconnected backends.</p><div className="ac-hero-links"><Link href="/portal/amanda-catherine/owner/academy">Open Academy</Link><Link href="/portal/amanda-catherine/owner/eva">Ask Eva</Link></div></div><div className="ac-hero-art"><Image src="/amanda-catherine/aesthetikine-studio-hero.jpg" alt="AesthetiKine wellness studio" fill priority sizes="(max-width: 700px) 100vw, 42vw"/><span>body · mind · business</span></div></section>
  <section><div className="ac-section-title"><div><span>QUICK ACTIONS</span><h2>What would you like to do?</h2></div><p>The most-used tools stay one tap away.</p></div><div className="ac-actions">{actions.map(([label,sub,href])=><Link href={href} key={href}><strong>{label}</strong><small>{sub}</small><b>↗</b></Link>)}</div></section>
  <section className="ac-grid-two"><article className="ac-card"><span className="ac-eyebrow">TODAY</span><h3>Appointments</h3><p>Jane remains the source of truth for bookings and availability.</p><a href="https://aesthetikine.janeapp.com/" target="_blank" rel="noopener noreferrer">Open Jane ↗</a></article><article className="ac-card ac-studio"><span className="ac-eyebrow">ACADEMY</span><h3>Your students should never be waiting on the portal.</h3><p>Courses, learner access, progress and certifications are surfaced from the shared learning layer.</p><Link href="/portal/amanda-catherine/owner/academy">Manage learning →</Link></article></section>
  <section><div className="ac-section-title"><div><span>BUSINESS PULSE</span><h2>At a glance</h2></div><Link href="/portal/amanda-catherine/owner/insights">View Insights →</Link></div><div className="ac-metrics"><article><strong>{insights.academy.studentCount}</strong><span>Students</span></article><article><strong>{insights.academy.progressRecordCount}</strong><span>Progress Records</span></article><article><strong>{insights.academy.certificateCount}</strong><span>Certificates</span></article><article><strong>{insights.academy.activeCourseCount}</strong><span>Active Courses</span></article></div></section>
  <section className="ac-card ac-programs"><div className="ac-section-title"><div><span>AESTHETIKINE ACADEMY</span><h2>Programs & Courses</h2></div><Link href="/portal/amanda-catherine/owner/academy">Manage Academy →</Link></div><div className="ac-course-list">{AMANDA_CANONICAL_ACADEMY_COURSES.map(c=><div key={c.id}><strong>{c.title}</strong><span>{cad.format(c.priceCad)}</span></div>)}</div></section>
  <section className="ac-grid-two"><article className="ac-card"><span className="ac-eyebrow">UPDATE HUB</span><h3>Your site changes, without chasing code.</h3><p>Request updates here. Governed changes are classified and verified before release.</p><Link href="/portal/amanda-catherine/owner/updates">Request an update →</Link></article><article className="ac-card"><span className="ac-eyebrow">EVA</span><h3>What needs your attention?</h3><p>Ask about enrollments, courses, website updates or the next business move.</p><Link className="ac-eva-button" href="/portal/amanda-catherine/owner/eva">Ask Eva →</Link></article></section>
 </div>
}
