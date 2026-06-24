'use client';

import type { DeviceKind, ExperienceScreen } from '@/lib/landing-experience';

/**
 * Recurring visual motif: the same EA platform shown across every story.
 * Renders an EA "screen" inside a phone or laptop frame using markup only
 * (no external screenshots), so it stays crisp, fast, and on-brand.
 */
export default function DeviceFrame({
  device,
  screen,
  className,
}: {
  device: DeviceKind;
  screen: ExperienceScreen;
  className?: string;
}) {
  const screenInner = (
    <div className="ea-dev-app" role="img" aria-label={`${screen.app} experience preview`}>
      <div className="ea-dev-statusbar">
        <span className="ea-dev-appname">{screen.app}</span>
        <span className="ea-dev-live">Live</span>
      </div>
      <ul className="ea-dev-list">
        {screen.items.map((item) => (
          <li key={item} className="ea-dev-row">
            <span className="ea-dev-dot" aria-hidden="true" />
            <span className="ea-dev-rowlabel">{item}</span>
            <span className="ea-dev-chevron" aria-hidden="true" />
          </li>
        ))}
      </ul>
      {screen.signals && screen.signals.length > 0 && (
        <div className="ea-dev-signals">
          {screen.signals.map((signal) => (
            <span key={signal} className="ea-dev-signal">
              <span className="ea-dev-check" aria-hidden="true" />
              {signal}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (device === 'laptop') {
    return (
      <div className={`ea-dev ea-dev-laptop${className ? ` ${className}` : ''}`}>
        <div className="ea-dev-laptop-lid">
          <div className="ea-dev-screen">{screenInner}</div>
        </div>
        <div className="ea-dev-laptop-base" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={`ea-dev ea-dev-phone${className ? ` ${className}` : ''}`}>
      <div className="ea-dev-notch" aria-hidden="true" />
      <div className="ea-dev-screen">{screenInner}</div>
    </div>
  );
}
