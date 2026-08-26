import Image from 'next/image';
import Link from 'next/link';
import type { PlatformRole } from '@/lib/rbac';
import { AMANDA_ROLE_DASHBOARDS } from '@/lib/amanda-catherine/config';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';

const DESTINATIONS: Array<[string[], string]> = [
  [['update-hub', 'website-update', 'site-update'], 'updates'],
  [['private-deliveries', 'media-delivery', 'recording', 'finished-work'], 'deliveries'],
  [['course', 'training', 'assessment', 'progress', 'certif'], 'learning'],
  [['appointment', 'schedule'], 'calendar'],
  [['event'], 'events'],
  [['form', 'consent', 'application', 'onboarding'], 'intake'],
  [['document', 'asset', 'media', 'template', 'protocol'], 'documents'],
  [['payment', 'receipt', 'tuition', 'invoice', 'package', 'membership', 'product'], 'billing'],
  [['message', 'announcement'], 'messaging'],
  [['report', 'lead', 'crm', 'people', 'referral', 'directory'], 'reports'],
  [['resource', 'policy'], 'resources'],
];

function hrefFor(slug: string, item: string) {
  const key = item.toLowerCase();
  const match = DESTINATIONS.find(([needles]) => needles.some((needle) => key.includes(needle)));
  return `/portal/${slug}/${match?.[1] || 'member'}`;
}

function label(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const ADMIN_SPOTLIGHTS = [
  {
    title: 'Website Updates',
    item: 'update-hub',
    summary: 'Photos, videos, links, copy, events, and page changes',
    action: 'Open Update Hub',
    icon: 'document',
  },
  {
    title: 'Client Delivery',
    item: 'media-delivery',
    summary: 'Recordings and finished work',
    action: 'Deliver To Client',
    icon: 'document',
  },
  {
    title: 'Today',
    item: 'appointments',
    summary: 'Appointments and calendar',
    action: 'View Calendar',
    icon: 'calendar',
  },
  {
    title: 'Client Activity',
    item: 'applications-and-forms',
    summary: 'Applications and forms',
    action: 'Review Applications',
    icon: 'document',
  },
  {
    title: 'Business Overview',
    item: 'reports-and-follow-ups',
    summary: 'Reports and follow-ups',
    action: 'Open Reports',
    icon: 'chart',
  },
] as const;

function SpotlightIcon({ name }: { name: (typeof ADMIN_SPOTLIGHTS)[number]['icon'] }) {
  if (name === 'calendar') {
    return <svg viewBox="0 0 24 24" aria-hidden><path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" /></svg>;
  }
  if (name === 'document') {
    return <svg viewBox="0 0 24 24" aria-hidden><path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M10 12h5m-5 4h5" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden><path d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>;
}

export default async function AmandaMemberHome({
  slug,
  email,
  role,
}: {
  slug: string;
  email: string;
  role?: PlatformRole;
}) {
  const audience = await resolveAmandaAudience({ portalSlug: slug, email, role });
  const items = AMANDA_ROLE_DASHBOARDS[audience];
  const isAdmin = audience === 'admin';

  if (isAdmin) {
    return (
      <section className="ak-admin-home" aria-label="Amanda Catherine administrator dashboard">
        <div className="ak-hero">
          <Image
            src="/amanda-catherine/aesthetikine-studio-hero.jpg"
            alt="AesthetiKine Studio Lab reception"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 310px), 100vw"
          />
          <div className="ak-hero-brand" aria-hidden>
            <span className="ak-hero-mark">AC</span>
            <strong>AesthetiKine</strong>
            <span>STUDIO LAB</span>
            <small>BY AMANDA CATHERINE</small>
          </div>
        </div>

        <div className="ak-spotlight-grid">
          {ADMIN_SPOTLIGHTS.map((spotlight) => (
            <article key={spotlight.title} className="ak-spotlight-column">
              <h2>{spotlight.title}</h2>
              <div className="ak-spotlight-card">
                <span className="ak-spotlight-icon"><SpotlightIcon name={spotlight.icon} /></span>
                <strong>{spotlight.summary}</strong>
                <Link href={hrefFor(slug, spotlight.item)}>
                  {spotlight.action}<span aria-hidden>›</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <Link href={`/portal/${slug}/messaging`} className="ak-attention-strip">
          <span className="ak-attention-icon" aria-hidden>✉</span>
          <span><strong>Messages and communications</strong><small>Open your inbox and automated communications.</small></span>
          <span aria-hidden>›</span>
        </Link>

        <section className="ak-business-links" aria-labelledby="ak-business-links-title">
          <div>
            <p className="ak-business-links__eyebrow">Business links</p>
            <h2 id="ak-business-links-title">Your public presence</h2>
          </div>
          <div className="ak-business-links__list">
            <a href="https://amandacatherine.ca/" target="_blank" rel="noopener noreferrer">AmandaCatherine.ca <span aria-hidden>↗</span></a>
            <a href="https://www.aesthetikine.com/" target="_blank" rel="noopener noreferrer">AesthetiKine website <span aria-hidden>↗</span></a>
            <a href="https://www.empowerartcollective.com/" target="_blank" rel="noopener noreferrer">Empower Art Collective <span aria-hidden>↗</span></a>
            <a href="https://www.instagram.com/amandacatherinec/" target="_blank" rel="noopener noreferrer">Amanda Catherine Instagram <span aria-hidden>↗</span></a>
            <a href="https://www.instagram.com/lifelinetour/" target="_blank" rel="noopener noreferrer">LIFELINE Tour Instagram <span aria-hidden>↗</span></a>
            <a href="https://www.instagram.com/aesthetikine/" target="_blank" rel="noopener noreferrer">AesthetiKine Instagram <span aria-hidden>↗</span></a>
            <a href="https://youtube.com/@empowerartcollective" target="_blank" rel="noopener noreferrer">Empower Art Collective YouTube <span aria-hidden>↗</span></a>
          </div>
          <div className="ak-business-links__finance">
            <Image src="/amanda-catherine/amanda-medicard-qr.jpg" alt="Amanda’s Medicard by iFinance QR code" fill sizes="220px" />
          </div>
        </section>

        <details className="ak-admin-directory">
          <summary>All administrator tools</summary>
          <ul>
            <li>
              <Link href={`/portal/${slug}/updates`}>Update Hub<span aria-hidden>›</span></Link>
            </li>
            {items.map((item) => (
              <li key={item}>
                <Link href={hrefFor(slug, item)}>{label(item)}<span aria-hidden>›</span></Link>
              </li>
            ))}
          </ul>
        </details>
      </section>
    );
  }

  return (
    <>
      <div className="ep-module-card" style={{ marginBottom: 18 }}>
        <p className="ep-module-card-title">Your Amanda Catherine workspace</p>
        <p className="ep-module-card-note">
          {label(audience)} view · the portal adapts to the work, enrollment, and applications connected to {email}.
        </p>
      </div>
      <ul className="ep-module-list">
        {items.map((item) => (
          <li key={item} className="ep-module-card">
            <Link href={hrefFor(slug, item)} className="ep-module-card-title">
              {label(item)}
            </Link>
            <p className="ep-module-card-note">Open this part of your Amanda Catherine path.</p>
          </li>
        ))}
      </ul>
    </>
  );
}
