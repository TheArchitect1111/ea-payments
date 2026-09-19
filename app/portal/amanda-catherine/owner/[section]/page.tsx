import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ENTREPRENEURIAL_ARTIST_COURSE } from '@/lib/amanda-catherine/config';
import { AMANDA_PRACTITIONER_KIT } from '@/lib/amanda-catherine/practitioner-kit-catalog';
import { DEFAULT_AMANDA_SITE_CONTENT } from '@/lib/amanda-catherine/site-content';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import type { PortalFormSubmission } from '@/lib/portal-forms/types';
import OwnerApplicationQueue from '../OwnerApplicationQueue';

const sections: Record<string, [string, string, string]> = {
  updates: ['Update Hub', 'GOVERNED CHANGES', 'Website and business change requests.'],
  appointments: ['Appointments / Jane', 'SCHEDULE', 'Jane appointment and clinical mentorship operations.'],
  clients: ['Clients', 'RELATIONSHIPS', 'Client relationships and follow-up.'],
  academy: ['AesthetiKine Academy', 'EDUCATION', 'Courses, enrollments, progress and certifications.'],
  'practitioner-kit': ['Practitioner Starter Kit', 'PRACTITIONER ESSENTIALS', 'BODY SCULPT Practitioner Starter Kit orders and fulfillment.'],
  lifeline: ['LIFELINE', 'CREATIVE ENTREPRENEURSHIP', 'LIFELINE programs, stories and community.'],
  'empower-art': ['Empower Art Collective', 'COMMUNITY IMPACT', 'Programs, events, volunteer interest and community support.'],
  advisory: ['Founder Advisory', 'ADVISORY', 'Strategic advisory and mentorship for founders, practitioners and purpose-driven leaders.'],
  clarity: ['Founder Clarity Session', 'FOUNDER CLARITY', '75-minute founder consultation, questionnaire, priorities and action steps.'],
  speaking: ['Speaking & Media', 'SPEAKING', 'Signature talks, media appearances and approved social channels.'],
  book: ['The Entrepreneurial Artist', 'BOOK & PROGRAM', 'Book, companion program and approved Amazon destination.'],
  riman: ['RIMAN Canada', 'PARTNERSHIPS', 'Canadian storefront destination and partnership resources.'],
  reviews: ['Reviews & Testimonials', 'SOCIAL PROOF', 'Approved reviews, testimonials and media proof.'],
  documents: ['Documents & Certifications', 'LIBRARY', 'Documents and completion records.'],
  marketing: ['Marketing', 'BRAND', 'Approved brand and publishing assets.'],
  insights: ['Business Insights', 'INTELLIGENCE', 'Business reporting and performance.'],
  eva: ['Eva', 'AI ASSISTANT', 'Amanda’s governed operating assistant.'],
  settings: ['Settings', 'PORTAL', 'Owner preferences, integrations and access controls.'],
};

const email = DEFAULT_AMANDA_SITE_CONTENT.contact.email;

function ExternalAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children} ↗</a>;
}

function ConnectedSection({ section, submissions }: { section: string; submissions: PortalFormSubmission[] }) {
  if (section === 'practitioner-kit') return <section className="ac-grid-two">
    <article className="ac-card"><span className="ac-eyebrow">PRODUCT</span><h3>{AMANDA_PRACTITIONER_KIT.name}</h3><p>{AMANDA_PRACTITIONER_KIT.description}</p><p><strong>${AMANDA_PRACTITIONER_KIT.priceCad} CAD</strong></p><Link href="/amanda-catherine/private/practitioner-kit">Open private checkout →</Link></article>
    <article className="ac-card"><span className="ac-eyebrow">FULFILLMENT</span><h3>Order support</h3><p>Paid orders are verified through Stripe and recorded for delivery arrangements. Use the purchaser’s Stripe receipt when resolving an order.</p><a href={`mailto:${email}?subject=${encodeURIComponent('Practitioner Kit order support')}`}>Contact Amanda by email →</a></article>
  </section>;

  if (section === 'empower-art') return <section className="ac-grid-two">
    <article className="ac-card"><span className="ac-eyebrow">PROGRAMS + EVENTS</span><h3>Collective operations</h3><p>Open the approved nonprofit site, current events and mission information.</p><p><ExternalAction href="https://www.empowerartcollective.com/">Open collective website</ExternalAction></p><p><ExternalAction href="https://empowerartcollective.com/events/">Review events</ExternalAction></p><ExternalAction href="https://empowerartcollective.com/about-us/">Review mission</ExternalAction></article>
    <article className="ac-card"><span className="ac-eyebrow">COMMUNITY SUPPORT</span><h3>Volunteers and partnerships</h3><p>Review volunteer, support and partnership interest through the approved collective contact pathway.</p><p><ExternalAction href="https://empowerartcollective.com/contact-us/">Open contact pathway</ExternalAction></p><a href={`mailto:${email}?subject=${encodeURIComponent('Empower Art Collective partnership')}`}>Email Amanda about a partnership →</a></article>
  </section>;

  if (section === 'book') return <section className="ac-grid-two">
    <article className="ac-card"><span className="ac-eyebrow">BOOK</span><h3>{ENTREPRENEURIAL_ARTIST_COURSE.title}</h3><p>Use the approved Canadian Amazon listing for purchase and customer support.</p><ExternalAction href={ENTREPRENEURIAL_ARTIST_COURSE.amazonBookUrl}>Open Amazon listing</ExternalAction></article>
    <article className="ac-card"><span className="ac-eyebrow">SIX-WEEK PROGRAM</span><h3>{ENTREPRENEURIAL_ARTIST_COURSE.totalLessons} lessons</h3><p>One lesson releases each Monday at 9:00 AM Eastern through the approved companion playlist.</p><p><ExternalAction href={ENTREPRENEURIAL_ARTIST_COURSE.playlistUrl}>Open program playlist</ExternalAction></p><Link href="/portal/amanda-catherine/learning">Open student learning area →</Link></article>
  </section>;

  if (section === 'advisory' || section === 'speaking' || section === 'lifeline') {
    return <OwnerApplicationQueue submissions={submissions} />;
  }

  return null;
}

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  const queueSections = new Set(['advisory', 'speaking', 'lifeline']);
  const allApplications = queueSections.has(section)
    ? await listPortalFormSubmissions('amanda-catherine', { kind: 'application' })
    : [];
  const submissions = allApplications.filter((submission) => {
    const formId = submission.payload?.formId;
    if (section === 'advisory') return formId === 'founder-advisory';
    if (section === 'speaking') return formId === 'speaking-media';
    if (section === 'lifeline') return formId === 'lifeline-media-guest'
      || (formId === 'partner-vendor-application' && submission.payload?.program === 'lifeline');
    return false;
  });
  const connected = ConnectedSection({ section, submissions });
  return <div className="ac-dashboard"><header className="ac-topbar"><div><small>AMANDA CATHERINE · PORTAL V2</small><h1>{item[0]}</h1><p>{item[2]}</p></div><div className="ac-status">V2 · Connected</div></header>{connected || <section className="ac-card"><span className="ac-eyebrow">{item[1]}</span><h3>Portal destination established.</h3><p>This destination mirrors the approved public-page offering. External source links that Amanda has not supplied remain intentionally unwired rather than guessed.</p><Link href="/portal/amanda-catherine/owner">← Return to Dashboard</Link></section>}{connected && <section className="ac-card"><Link href="/portal/amanda-catherine/owner">← Return to Dashboard</Link></section>}</div>;
}
