import Image from 'next/image';
import Link from 'next/link';
import type { PlatformRole } from '@/lib/rbac';
import { AMANDA_ROLE_DASHBOARDS } from '@/lib/amanda-catherine/config';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import styles from './AmandaOwnerDashboard.module.css';

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

const NAV_ITEMS = [
  ['⌂', 'Dashboard', ''],
  ['✎', 'Update Hub', 'updates'],
  ['▣', 'Appointments', 'calendar'],
  ['♙', 'Clients', 'people'],
  ['◇', 'Programs & Courses', 'learning'],
  ['□', 'Documents', 'documents'],
  ['◉', 'Marketing', 'amplifi'],
  ['▥', 'Reports', 'reports'],
  ['✦', 'Eva', 'ask'],
  ['⚙', 'Settings', 'settings'],
] as const;

const QUICK_ACTIONS = [
  ['✎', 'Update Hub', 'Request changes, add content, or share files.', 'updates'],
  ['▣', 'Appointments', 'Open scheduling and calendar tools.', 'calendar'],
  ['♙', 'Clients', 'Review people, applications, and follow-up.', 'people'],
  ['◇', 'Programs', 'Manage courses, training, and certifications.', 'learning'],
] as const;

const OVERVIEW = [
  ['♙', 'Clients', 'Open live client workspace', 'people'],
  ['▣', 'Appointments', 'Open live calendar', 'calendar'],
  ['◇', 'Programs', 'Open learning workspace', 'learning'],
  ['▥', 'Reports', 'Open business reporting', 'reports'],
] as const;

const TOOLS = [
  ['□', 'Documents', 'Contracts, forms, resources', 'documents'],
  ['◉', 'Marketing', 'Social, media, email and content', 'amplifi'],
  ['▥', 'Reports', 'Insights and follow-up', 'reports'],
  ['✦', 'Eva', 'Get help, answers and next actions', 'ask'],
] as const;

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
      <section className={styles.shell} aria-label="Amanda Catherine owner portal">
        <aside className={styles.sidebar}>
          <a href="https://amandacatherine.ca/" className={styles.brand} target="_blank" rel="noopener noreferrer">
            <span className={styles.brandMark}>AC</span>
            <span className={styles.brandText}>
              <strong>AesthetiKine</strong>
              <span>STUDIO LAB · AMANDA CATHERINE</span>
            </span>
          </a>

          <nav className={styles.nav} aria-label="Amanda owner navigation">
            {NAV_ITEMS.map(([icon, title, route], index) => (
              <Link
                key={title}
                href={route ? `/portal/${slug}/${route}` : `/portal/${slug}`}
                className={`${styles.navLink} ${index === 0 ? styles.navActive : ''}`}
              >
                <span className={styles.navIcon} aria-hidden>{icon}</span>
                <span>{title}</span>
                {title === 'Eva' ? <span className={styles.evaBadge}>New</span> : null}
              </Link>
            ))}
          </nav>

          <div className={styles.sidebarQuote}>
            “Healthy movement creates a stronger, brighter you.”
            <small>AMANDA CATHERINE</small>
          </div>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.motto}>Move Better · Look Better · Live Better</div>
            <div className={styles.account}>
              <span className={styles.accountAvatar}>AC</span>
              <span>
                <strong>Amanda Catherine</strong>
                <span>Owner</span>
              </span>
            </div>
          </header>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Owner portal</p>
              <h1>Welcome, Amanda</h1>
              <p className={styles.heroLead}>Your business, clients, programs, content, and next steps in one place.</p>
              <div className={styles.heroActions}>
                <a className={styles.primary} href="https://amandacatherine.ca/" target="_blank" rel="noopener noreferrer">View Website ↗</a>
                <Link className={styles.secondary} href={`/portal/${slug}/updates`}>Open Update Hub</Link>
                <Link className={styles.secondary} href={`/portal/${slug}/ask`}>✦ Ask Eva</Link>
              </div>
            </div>
            <div className={styles.heroMedia}>
              <Image
                src="/amanda-catherine/aesthetikine-studio-hero.jpg"
                alt="AesthetiKine Studio Lab"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 45vw"
              />
            </div>
          </section>

          <div className={styles.content}>
            <section>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.quickGrid}>
                {QUICK_ACTIONS.map(([icon, title, copy, route]) => (
                  <Link key={title} href={`/portal/${slug}/${route}`} className={`${styles.card} ${styles.quickCard}`}>
                    <span className={styles.cardIcon} aria-hidden>{icon}</span>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                    <span className={styles.arrow} aria-hidden>→</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className={styles.twoCol}>
              <article className={`${styles.card} ${styles.brandCard}`}>
                <h3>AesthetiKine Studio Lab</h3>
                <p>Your brand. Your mission. A stronger, healthier you.</p>
                <div className={styles.brandCardImage}>
                  <Image src="/amanda-catherine/aesthetikine-studio-hero.jpg" alt="AesthetiKine Studio Lab reception" fill sizes="(max-width: 760px) 100vw, 50vw" />
                </div>
                <p className={styles.brandQuote}>“Empowering movement. Transforming lives.”</p>
              </article>

              <div className={styles.sideStack}>
                <article className={`${styles.card} ${styles.sidePanel}`}>
                  <h3>Today</h3>
                  <div className={styles.actionList}>
                    <Link className={styles.actionRow} href={`/portal/${slug}/calendar`}>
                      <span><strong>Appointments and calendar</strong><span>View the live schedule</span></span><b>→</b>
                    </Link>
                    <Link className={styles.actionRow} href={`/portal/${slug}/messaging`}>
                      <span><strong>Messages</strong><span>Open client and team communications</span></span><b>→</b>
                    </Link>
                  </div>
                </article>

                <article className={`${styles.card} ${styles.sidePanel}`}>
                  <h3>Recent Activity</h3>
                  <div className={styles.actionList}>
                    <Link className={styles.actionRow} href={`/portal/${slug}/intake`}>
                      <span><strong>Applications and forms</strong><span>Review incoming client activity</span></span><b>→</b>
                    </Link>
                    <Link className={styles.actionRow} href={`/portal/${slug}/deliveries`}>
                      <span><strong>Client delivery</strong><span>Recordings and finished work</span></span><b>→</b>
                    </Link>
                  </div>
                </article>
              </div>
            </section>

            <section>
              <h2 className={styles.sectionTitle}>Business Overview</h2>
              <div className={styles.overviewGrid}>
                {OVERVIEW.map(([icon, title, copy, route]) => (
                  <Link key={title} href={`/portal/${slug}/${route}`} className={`${styles.card} ${styles.overviewCard}`}>
                    <span className={styles.cardIcon} aria-hidden>{icon}</span>
                    <strong>{title}</strong>
                    <span>{copy}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className={styles.bottomGrid}>
              <article className={`${styles.card} ${styles.toolPanel}`}>
                <h3>Tools & Resources</h3>
                <div className={styles.toolGrid}>
                  {TOOLS.map(([icon, title, copy, route]) => (
                    <Link key={title} href={`/portal/${slug}/${route}`} className={styles.tool}>
                      <span className={styles.cardIcon} aria-hidden>{icon}</span>
                      <strong>{title}</strong>
                      <span>{copy}</span>
                      <b>→</b>
                    </Link>
                  ))}
                </div>
              </article>

              <article className={`${styles.card} ${styles.publicPanel}`}>
                <p>A STRONGER YOU<br />CHANGES EVERYTHING.</p>
                <a href="https://amandacatherine.ca/" target="_blank" rel="noopener noreferrer">View your public presence ↗</a>
              </article>
            </section>
          </div>

          <footer className={styles.footer}>
            <strong>AesthetiKine Studio Lab · by Amanda Catherine</strong>
            <span>Owner workspace powered by Efficiency Architects</span>
          </footer>

          <nav className={styles.mobileNav} aria-label="Amanda mobile navigation">
            <Link href={`/portal/${slug}`}><b>⌂</b><span>Home</span></Link>
            <Link href={`/portal/${slug}/updates`}><b>✎</b><span>Updates</span></Link>
            <Link href={`/portal/${slug}/ask`}><b>✦</b><span>Eva</span></Link>
            <Link href={`/portal/${slug}/settings`}><b>⚙</b><span>More</span></Link>
          </nav>
        </div>
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
