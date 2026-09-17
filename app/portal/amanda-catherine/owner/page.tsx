import Image from 'next/image';
import Link from 'next/link';
import { AMANDA_CANONICAL_ACADEMY_COURSES } from '@/lib/amanda-catherine/canonical-courses';
import { getAmandaOwnerInsights } from '@/lib/amanda-catherine/insights';

const actions = [
  ['Manage Appointments', '/portal/amanda-catherine/owner/appointments'],
  ['Manage Clients', '/portal/amanda-catherine/owner/clients'],
  ['Academy Courses', '/portal/amanda-catherine/owner/academy'],
  ['LIFELINE', '/portal/amanda-catherine/owner/lifeline'],
  ['Update Website', '/portal/amanda-catherine/owner/updates'],
  ['View Reports', '/portal/amanda-catherine/owner/insights'],
  ['Ask Eva', '/portal/amanda-catherine/owner/eva'],
] as const;

export const metadata = { title: 'Amanda Catherine · Owner Portal V2' };
const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

export default async function AmandaOwnerDashboard() {
  const insights = await getAmandaOwnerInsights();
  return <div className="ac-dashboard">
    <header className="ac-topbar"><div><small>AESTHETIKINE STUDIO LAB · OWNER PORTAL</small><h1>Welcome, Amanda.</h1><p>Your studio, academy and creative business in one calm place.</p></div><div className="ac-status">Studio Lab · Active</div></header>
    <section className="ac-hero"><div className="ac-hero-copy"><span className="ac-kicker">AESTHETIKINE STUDIO LAB</span><h2>Make space for the work that matters.</h2><p>Appointments, clients, education, LIFELINE and business intelligence are gathered here, with Eva ready to guide the next move.</p></div><div className="ac-hero-art"><Image src="/amanda-catherine/aesthetikine-studio-hero.jpg" alt="AesthetiKine wellness studio" fill priority sizes="(max-width: 700px) 100vw, 42vw" /><span>body · mind · business</span></div></section>
    <section><div className="ac-section-title"><div><span>OPERATE</span><h2>Quick Actions</h2></div><p>Everything important, within reach.</p></div><div className="ac-actions">{actions.map(([label, href]) => <Link href={href} key={href}>{label}<b>↗</b></Link>)}</div></section>
    <section className="ac-grid-two"><article className="ac-card"><span className="ac-eyebrow">TODAY</span><h3>Appointments</h3><div className="ac-empty"><strong>Jane keeps the calendar.</strong><p>Open Amanda&apos;s booking workspace to manage appointments and availability.</p><a href="https://aesthetikine.janeapp.com/" target="_blank" rel="noopener noreferrer">Open Jane ↗</a></div></article><article className="ac-card ac-studio"><span className="ac-eyebrow">STUDIO LAB</span><h3>A living practice.</h3><p>AesthetiKine connects functional aesthetics, nervous-system care and practitioner education. Portal V2 is the operating room behind that experience.</p><Link href="/portal/amanda-catherine/owner/academy">Enter Academy →</Link></article></section>
    <section><div className="ac-section-title"><div><span>BUSINESS PULSE</span><h2>Overview</h2></div><Link href="/portal/amanda-catherine/owner/insights">View Business Insights →</Link></div><div className="ac-metrics"><article><strong>{insights.academy.progressRecordCount}</strong><span>Progress Records</span></article><article><strong>{insights.academy.studentCount}</strong><span>Students</span></article><article><strong>{insights.academy.certificateCount}</strong><span>Certificates</span></article><article><strong>{insights.academy.activeCourseCount}</strong><span>Academy Courses</span></article></div></section>
    <section className="ac-card ac-programs"><div className="ac-section-title"><div><span>AESTHETIKINE ACADEMY</span><h2>Programs & Courses</h2></div><Link href="/portal/amanda-catherine/owner/academy">Manage Academy →</Link></div><div className="ac-course-list">{AMANDA_CANONICAL_ACADEMY_COURSES.map((course) => <div key={course.id}><strong>{course.title}</strong><span>{cad.format(course.priceCad)}</span></div>)}</div></section>
    <section className="ac-grid-two"><article className="ac-card"><span className="ac-eyebrow">LIFELINE</span><h3>Stories into strategy.</h3><p>Creative entrepreneurship, mentorship and strategic launch support live alongside AesthetiKine without becoming a separate operating island.</p><Link href="/portal/amanda-catherine/owner/lifeline">Open LIFELINE →</Link></article><article className="ac-card"><span className="ac-eyebrow">EVA</span><h3>What would you like to change?</h3><p>Ask about enrollments, courses, website updates or the next business move. Governed website changes route through the Update Hub.</p><Link className="ac-eva-button" href="/portal/amanda-catherine/owner/eva">Ask Eva →</Link></article></section>
  </div>;
}
