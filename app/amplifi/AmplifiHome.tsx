'use client';

import Image from 'next/image';

export type AmplifiHomePath = 'publish' | 'smartchitecture' | 'research';

type AmplifiHomeProps = {
  ownerMode: boolean;
  loggedIn: boolean;
  connectedChannels: string[];
  connectionsLoading: boolean;
  connectionsError?: string | null;
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
    number: '02',
    icon: '✦',
    title: 'I’ll create it',
    description: 'Enter your title, source, hook, takeaway and content. Amplifi guides you as you build it.',
    button: 'Start creating',
    example: 'Your words · Amplifi guidance',
  },
  {
    id: 'smartchitecture',
    number: '03',
    icon: '•••',
    title: 'Create it for me',
    description: 'Share a short brief. Amplifi creates a complete five-post campaign for you.',
    button: 'Tell Amplifi',
    example: 'One goal · A complete campaign',
  },
  {
    id: 'research',
    number: '04',
    icon: '⌕',
    title: 'Research and create it',
    description: 'Set a topic and timeframe. Amplifi researches once or automatically for up to three months, then creates 1–3 posts per search.',
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

function IdeaBoxPath() {
  return (
    <article className="af-home-path af-idea-box-path">
      <span className="af-path-number">01</span>
      <span className="af-path-icon" aria-hidden="true">▣</span>
      <div className="af-path-copy">
        <h2>Idea Box</h2>
        <p>Don’t know what to post yet? Brain dump the thought, event, inspiration, image, file or link. Amplifi finds the opportunities inside it.</p>
        <small>Brain dump · Save it · Find the opportunities · Build what works</small>
      </div>
      <a className="af-path-link-button" href="/amplifi/idea-box">Open Idea Box<span>→</span></a>
    </article>
  );
}

function ConnectionStatus({
  channels,
  loading,
  error,
  onOpen,
}: {
  channels: string[];
  loading: boolean;
  error?: string | null;
  onOpen: () => void;
}) {
  const facebook = channels.some((channel) => channel.toLowerCase() === 'facebook');
  const instagram = channels.some((channel) => channel.toLowerCase() === 'instagram');
  return (
    <button type="button" className="af-home-connections" aria-label="Manage social connections" onClick={onOpen}>
      <span className={facebook ? 'af-channel af-channel-on' : 'af-channel'} aria-label={facebook ? 'Facebook connected' : 'Facebook not connected'}>f</span>
      <span className={instagram ? 'af-channel af-channel-instagram af-channel-on' : 'af-channel af-channel-instagram'} aria-label={instagram ? 'Instagram connected' : 'Instagram not connected'}>◎</span>
      <strong>{loading ? 'Checking social connections…' : error ? 'Connection status unavailable' : channels.length ? `${channels.length} channel${channels.length === 1 ? '' : 's'} connected` : 'Connect social platforms'}</strong>
      <span className="af-manage-connections">Manage connections →</span>
    </button>
  );
}

export default function AmplifiHome({
  ownerMode,
  loggedIn,
  connectedChannels,
  connectionsLoading,
  connectionsError,
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
          <button type="button" onClick={() => onOpenSection('connections')}>Connections</button>
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
              <p>Reach, engagement and link clicks will use live campaign data, never placeholder numbers.</p>
              <button type="button" onClick={() => onOpenSection('results')}>Open results</button>
            </div>
            <ConnectionStatus channels={connectedChannels} loading={connectionsLoading} error={connectionsError} onOpen={() => onOpenSection('connections')} />
          </section>
        </main>
      ) : (
        <main className="af-client-home">
          <section className="af-client-intro">
            <span className="af-home-kicker">YOUR AMPLIFI STARTING POINT</span>
            <h1>What would you like Amplifi to do?</h1>
            <p>Choose how you want to begin. Amplifi will guide you through the rest.</p>
          </section>

          <section className="af-home-paths" aria-label="Amplifi Idea Box">
            <IdeaBoxPath />
          </section>

          {connectionsLoading ? (
            <section className="af-home-paths" aria-live="polite">
              <article className="af-home-path">
                <span className="af-path-number">02</span>
                <span className="af-path-icon" aria-hidden="true">↻</span>
                <div className="af-path-copy">
                  <h2>Checking your social accounts</h2>
                  <p>Amplifi is confirming which accounts are connected before you begin creating or publishing.</p>
                  <small>Idea Box is available while Amplifi checks your accounts.</small>
                </div>
              </article>
            </section>
          ) : connectedChannels.length === 0 ? (
            <section className="af-home-paths" aria-label="Connect social accounts to create and publish">
              <article className="af-home-path">
                <span className="af-path-number">02</span>
                <span className="af-path-icon" aria-hidden="true">＋</span>
                <div className="af-path-copy">
                  <h2>Connect your social accounts</h2>
                  <p>Idea Box is ready now. Connect the accounts you want Amplifi to use when you are ready to create, schedule or publish.</p>
                  <small>Your accounts and content remain isolated inside your workspace.</small>
                </div>
                <button type="button" onClick={() => onOpenSection('connections')}>Connect accounts<span>→</span></button>
              </article>
            </section>
          ) : (
            <>
              <ConnectionStatus channels={connectedChannels} loading={false} error={connectionsError} onOpen={() => onOpenSection('connections')} />
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
            </>
          )}

          <footer className="af-client-footer">
            <p>{connectedChannels.length ? 'Idea Box and your publishing tools are ready. Nothing publishes until you approve it.' : 'Idea Box is always available. Connect at least one account to unlock creating, research, scheduling and publishing.'}</p>
          </footer>
        </main>
      )}
    </div>
  );
}
