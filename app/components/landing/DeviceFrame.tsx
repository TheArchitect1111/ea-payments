'use client';

import Image from 'next/image';
import type { BuiltScreen, DeviceKind, PortalPage } from '@/lib/landing-experience';

const PAGE_LABELS: Record<PortalPage, string> = {
  dashboard: 'Dashboard',
  updates: 'Update Hub',
  resources: 'Resources',
  events: 'Events',
};

/** Built EA portal screen — used only where no real mockup is supplied. */
function PortalScreen({ screen }: { screen: BuiltScreen }) {
  const nav: PortalPage[] = ['dashboard', 'updates', 'resources', 'events'];
  return (
    <div className="ea-builtportal" role="img" aria-label={`${screen.orgLabel} EA portal`}>
      <aside className="ea-builtportal-side" aria-hidden="true">
        <div className="ea-builtportal-brand">
          <Image src="/ea-logo.png" alt="" width={20} height={20} />
          <span>{screen.orgLabel}</span>
        </div>
        <ul>
          {nav.map((id) => (
            <li key={id} className={screen.portalPage === id ? 'is-active' : ''}>
              {PAGE_LABELS[id]}
            </li>
          ))}
        </ul>
      </aside>
      <div className="ea-builtportal-main">
        <header className="ea-builtportal-top">
          <span>{PAGE_LABELS[screen.portalPage]}</span>
          <span className="ea-builtportal-live">Live</span>
        </header>
        <div className="ea-builtportal-cards">
          <div><span>Schedules</span><strong>Updated</strong></div>
          <div><span>Payments</span><strong>$12,840</strong></div>
          <div><span>Forms</span><strong>3 due</strong></div>
          <div><span>Events</span><strong>5 this week</strong></div>
        </div>
        <div className="ea-builtportal-chart" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>
      </div>
    </div>
  );
}

/** Renders a built EA portal inside a device frame (phone / laptop / desktop). */
export default function DeviceFrame({
  device = 'desktop',
  screen,
  className,
}: {
  device?: DeviceKind;
  screen: BuiltScreen;
  className?: string;
}) {
  const content = <PortalScreen screen={screen} />;

  if (device === 'laptop') {
    return (
      <div className={`ea-dev ea-dev-laptop${className ? ` ${className}` : ''}`}>
        <div className="ea-dev-laptop-lid">
          <div className="ea-dev-screen">{content}</div>
        </div>
        <div className="ea-dev-laptop-base" aria-hidden="true" />
      </div>
    );
  }

  // desktop (default for the built fallback)
  return (
    <div className={`ea-dev ea-dev-desktop${className ? ` ${className}` : ''}`}>
      <div className="ea-dev-desktop-bezel">
        <div className="ea-dev-screen">{content}</div>
      </div>
      <div className="ea-dev-desktop-stand" aria-hidden="true" />
    </div>
  );
}
