'use client';

import Image from 'next/image';

export type AmplifiHomePath = 'publish' | 'smartchitecture' | 'research';

type AmplifiHomeProps = {
  ownerMode: boolean;
  loggedIn: boolean;
  connectedChannels: string[];
  approvedPostTitle?: string | null;
  onChoosePath: (path: AmplifiHomePath) => void;
  onOpenSection: (sectionId: string) => void;
};

const PATHS: Array<{
  id: AmplifiHomePath;
  number: string;
  icon: string;
  title: string;
  description: string;
  button: string;
  example: string;
}> = [
  {
    id: 'publish',
    number: '01',
    icon: '✦',
    title: 'I’ll create it',
    description: 'Build a post or complete campaign with clear, guided tools.',
    button: 'Start creating',
    example: 'Your words · Amplifi guidance',
  },
  {
    id: 'smartchitecture',
    number: '02',
    icon: '•••',
    title: 'Create it for me',
    description: 'Share your goal, event, offer or idea. Amplifi builds the campaign.',
    button: 'Tell Amplifi',
    example: 'One goal · A complete campaign',
  },
  {
    id: 'research',
    number: '03',
    icon: '⌕',
    title: 'Research and create it',
    description: 'Amplifi finds credible data, links and images, then creates the campaign.',
    button: 'Start research',
    example: 'Verified sources · Ready-to-review posts',
  },
];

function AmplifiLogo() {
  return (
    <Image
      className="af-home-logo"
      src="/amplifi/amplifi-logo-premium.png"
      alt="Amplifi by Efficiency Architects"
      width={1973}
      height={797}
      priority
    />
  );
}

function ConnectionStatus({ channels }: { channels: string[] }) {
  const facebook = channels.some((channel) => channel.toLowerCase() === 'facebook');
  const instagram = channels.some((channel) => channel.toLowerCase() === 'instagram');
  return (
    <div className="af-home-connections" aria-label="Connected social channels">
      <span className={facebook ? 'af-channel af-channel-on' : 'af-channel'} aria-label={facebook ? 'Facebook connected' : 'Facebook not connected'}>f</span>
      <span className={instagram ? 'af-channel af-channel-instagram af-channel-on' : 'af-channel af-channel-instagram'} aria-label={instagram ? 'Instagram connected' : 'Instagram not connected'}>◎</span>
      <strong>{channels.length ? `${channels.length} channel${channels.length === 1 ? '' : 's'} connected` : 'Connect Facebook and Instagram'}</strong>
    </div>
  );
}

export default function AmplifiHome({
  ownerMode,
  loggedIn,
  connectedChannels,
  approvedPostTitle,
  onChoosePath,
  onOpenSection,
}: AmplifiHomeProps) {
  return (
    <div className="af-home-shell">
      <header className="af-home-header">
        <a href="/amplifi/workspace" aria-label="Amplifi home"><AmplifiLogo /></a>
        <nav aria-label="Amplifi navigation">
          <button type="button" className="is-active">Home</button>
          <button type="button" onClick={() => onOpenSection(ownerMode ? 'approved-posts' : 'content')}>{ownerMode ? 'Approvals' : 'Campaigns'}</button>
          <button type="button" onClick={() => onOpenSection('calendar')}>Calendar</button>
          <button type="button" onClick={() => onOpenSection('results')}>Results</button>
          <button type="button" onClick={() => onOpenSection(ownerMode ? 'connections' : 'search')}>{ownerMode ? 'Settings' : 'Help'}</button>
        </nav>
        {ownerMode ? (
          <button type="button" className="af-home-primary af-new-campaign" onClick={() => onChoosePath('smartchitecture')}>＋ New campaign</button>
        ) : loggedIn ? (
          <span className="af-signed-in">Signed in</span>
        ) : (
          <a className="af-home-signin" href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</a>
        )}
      </header>

      {ownerMode ? (
        <main className="af-owner-home">
          <section className="af-owner-intro">
            <div><span className="af-home-kicker">AMPLIFI OWNER HOME</span><h1>Good morning, Robert.</h1><p>Here’s what needs your attention.</p></div>
          </section>

          <button type="button" className="af-owner-approval" onClick={() => onOpenSection('approved-posts')}>
            <span className="af-owner-icon">✓</span>
            <span>
              <small>NEXT BEST ACTION</small>
              <strong>{approvedPostTitle ? '1 post ready for publishing review' : 'Review posts waiting for approval'}</strong>
              <em>{approvedPostTitle ?? 'Approved work appears here as soon as it is ready.'}</em>
            </span>
            <b>Review posts →</b>
          </button>

          <section className="af-owner-scheduled">
            <span className="af-owner-icon af-owner-icon-green">31</span>
            <span><small>CAMPAIGN SCHEDULE</small><strong>See what Amplifi is publishing next</strong><em>Facebook and Instagram campaigns stay together in one calendar.</em></span>
            <button type="button" onClick={() => onOpenSection('calendar')}>View calendar</button>
          </section>

          <section className="af-owner-bottom">
            <div>
              <span className="af-home-kicker">RESULTS</span>
              <h2>Performance appears after publishing.</h2>
              <p>Reach, engagement and link clicks will use live campaign data—never placeholder numbers.</p>
              <button type="button" onClick={() => onOpenSection('results')}>Open results</button>
            </div>
            <ConnectionStatus channels={connectedChannels} />
          </section>
        </main>
      ) : (
        <main className="af-client-home">
          <section className="af-client-intro">
            <span className="af-home-kicker">YOUR AMPLIFI STARTING POINT</span>
            <h1>What would you like Amplifi to do?</h1>
            <p>Choose how you want to begin. Amplifi will guide you through the rest.</p>
          </section>

          <section className="af-home-paths" aria-label="Choose an Amplifi path">
            {PATHS.map((path) => (
              <article key={path.id} className="af-home-path">
                <span className="af-path-number">{path.number}</span>
                <span className="af-path-icon" aria-hidden="true">{path.icon}</span>
                <div className="af-path-copy">
                  <h2>{path.title}</h2>
                  <p>{path.description}</p>
                  <small>{path.example}</small>
                </div>
                <button type="button" onClick={() => onChoosePath(path.id)}>{path.button}<span>→</span></button>
              </article>
            ))}
          </section>

          <footer className="af-client-footer">
            <ConnectionStatus channels={connectedChannels} />
            <p>Nothing publishes until you approve it.</p>
          </footer>
        </main>
      )}
    </div>
  );
}
