'use client';

import { useMemo, useState } from 'react';

type ScreenId = 'home' | 'opportunities' | 'watch' | 'radar' | 'wins';
type EnvironmentId = 'air' | 'ocean' | 'summit' | 'ember' | 'still-water';

const screens: Array<{ id: ScreenId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'watch', label: 'Watch List' },
  { id: 'radar', label: 'Radar' },
  { id: 'wins', label: 'Wins' },
];

const environments: Array<{
  id: EnvironmentId;
  name: string;
  mood: string;
  orb: string;
}> = [
  {
    id: 'air',
    name: 'Air',
    mood: 'Clear, light, spacious. The user feels room to think.',
    orb: 'soft atmospheric pulse',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    mood: 'Calm depth. The user feels held, oriented, and less rushed.',
    orb: 'tidal glow',
  },
  {
    id: 'summit',
    name: 'Summit',
    mood: 'Elevation and momentum. The user can see the next climb.',
    orb: 'altitude signal',
  },
  {
    id: 'ember',
    name: 'Ember',
    mood: 'Focused heat. The user feels ambition becoming usable energy.',
    orb: 'contained spark',
  },
  {
    id: 'still-water',
    name: 'Still Water',
    mood: 'Quiet relief. The user feels the noise settle before choosing the next move.',
    orb: 'calm surface pulse',
  },
];

const opportunityItems = [
  {
    title: 'Bob Rumball Centre training transformation',
    meta: 'Website + Portal + Learning Hub',
    score: 94,
    detail: 'Convert videos, SOPs, policies, and PowerPoints into modular learning.',
  },
  {
    title: 'Volunteer onboarding kit',
    meta: 'Training system',
    score: 86,
    detail: 'Turn scattered orientation material into a guided first-week path.',
  },
  {
    title: 'Donor story library',
    meta: 'Visibility engine',
    score: 81,
    detail: 'Capture field stories and route the strongest ones into Magnifi.',
  },
];

const watchItems = [
  'Training transformation partners',
  'Nonprofit portal opportunities',
  'Reusable learning modules',
  'Accessibility-first onboarding',
];

const radarSignals = [
  { label: 'Learning Hub fit', value: 94 },
  { label: 'Portal readiness', value: 88 },
  { label: 'Story potential', value: 82 },
  { label: 'Implementation clarity', value: 76 },
];

const wins = [
  'First opportunity captured',
  'Training package identified',
  'Recommended repos selected',
  'Approval path queued',
];

function screenTitle(screen: ScreenId) {
  switch (screen) {
    case 'home':
      return 'Today in Simplifi';
    case 'opportunities':
      return 'Opportunities';
    case 'watch':
      return 'Watch List';
    case 'radar':
      return 'Radar';
    case 'wins':
      return 'Wins';
  }
}

function screenLead(screen: ScreenId) {
  switch (screen) {
    case 'home':
      return 'Save what matters, see the strongest path, and keep momentum visible.';
    case 'opportunities':
      return 'Every captured signal is scored, summarized, and ready for action.';
    case 'watch':
      return 'The active things you want Simplifi to keep watching for you.';
    case 'radar':
      return 'Pattern signals from your saved opportunities and launch context.';
    case 'wins':
      return 'Proof that good opportunities are no longer slipping away.';
  }
}

function EnvironmentFrame({ environment, screen }: {
  environment: (typeof environments)[number];
  screen: ScreenId;
}) {
  const featured = opportunityItems[0];
  const isRadar = screen === 'radar';

  return (
    <article className={`se-env se-env-${environment.id}`} aria-label={`${environment.name} ${screenTitle(screen)} mockup`}>
      <div className="se-env-top">
        <div>
          <p className="se-label">{environment.name}</p>
          <h2>{screenTitle(screen)}</h2>
        </div>
        <div className="se-orb-wrap" aria-label={`${environment.name} orb treatment`}>
          <span className="se-orb" />
        </div>
      </div>

      <p className="se-mood">{environment.mood}</p>

      <div className="se-device">
        <div className="se-appbar">
          <span>SIMPLIFI</span>
          <span>{environment.orb}</span>
        </div>

        <div className="se-hero">
          <p>{screenTitle(screen)}</p>
          <h3>{screenLead(screen)}</h3>
        </div>

        {screen === 'home' && (
          <div className="se-stack">
            <div className="se-feature">
              <p className="se-kicker">Best next capture</p>
              <h4>{featured.title}</h4>
              <p>{featured.detail}</p>
              <div className="se-score-row">
                <span>Opportunity score</span>
                <strong>{featured.score}</strong>
              </div>
            </div>
            <div className="se-two">
              <MiniStat label="Watch List" value="4" />
              <MiniStat label="Wins" value="4" />
            </div>
          </div>
        )}

        {screen === 'opportunities' && (
          <div className="se-list">
            {opportunityItems.map((item) => (
              <div className="se-row" key={item.title}>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.meta}</p>
                </div>
                <strong>{item.score}</strong>
              </div>
            ))}
          </div>
        )}

        {screen === 'watch' && (
          <div className="se-chips">
            {watchItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}

        {isRadar && (
          <div className="se-radar">
            <div className="se-radar-core">
              <span />
            </div>
            <div className="se-bars">
              {radarSignals.map((signal) => (
                <div className="se-bar" key={signal.label}>
                  <div>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </div>
                  <i style={{ width: `${signal.value}%` }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'wins' && (
          <div className="se-wins">
            {wins.map((win, index) => (
              <div className="se-win" key={win}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <span>{win}</span>
              </div>
            ))}
          </div>
        )}

        <nav className="se-tabbar" aria-label={`${environment.name} preview nav`}>
          {screens.map((item) => (
            <span className={item.id === screen ? 'se-active' : ''} key={item.id}>{item.label}</span>
          ))}
        </nav>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="se-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function SimplifiEnvironmentComparison() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const activeScreen = useMemo(() => screens.find((item) => item.id === screen) ?? screens[0], [screen]);

  return (
    <main className="se-page">
      <section className="se-header">
        <p className="se-eyebrow">Simplifi environment mockups</p>
        <div className="se-header-grid">
          <div>
            <h1>Air, Ocean, Summit, Ember, Still Water</h1>
            <p>
              Five complete visual directions using identical Simplifi content across Home,
              Opportunities, Watch List, Radar, and Wins.
            </p>
          </div>
          <div className="se-note">
            <strong>Selected screen</strong>
            <span>{activeScreen.label}</span>
          </div>
        </div>
      </section>

      <section className="se-controls" aria-label="Choose screen">
        {screens.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === screen ? 'se-control-active' : ''}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="se-compare" aria-label="Side-by-side environment comparison">
        {environments.map((environment) => (
          <EnvironmentFrame key={environment.id} environment={environment} screen={screen} />
        ))}
      </section>
    </main>
  );
}
