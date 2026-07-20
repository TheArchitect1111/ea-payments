import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { captureToObject } from '@/lib/simplifi-objects';
import { computePriorityScore, priorityLevelLabel } from '@/lib/priority-engine';
import { parseBlueprintSummary } from '@/lib/blueprint-summary';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import SimplifiProductShell from '../../components/SimplifiProductShell';
import OpportunityActions from './OpportunityActions';
import '../../workspace/simplifi-workspace.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function OpportunityProfilePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const slug = session?.slug ?? null;
  const slice = await loadOrbWorkspaceSlice(slug);

  const capture = await getCaptureByIdentifier(id);
  if (!capture) notFound();

  if (slug && capture.portalSlug && capture.portalSlug.trim().toLowerCase() !== slug.trim().toLowerCase()) {
    notFound();
  }

  const base = captureToObject(capture, EA_PLATFORM_URL);
  const ps = computePriorityScore(base);
  const obj = { ...base, priorityScore: ps.score, priorityLevel: ps.level };
  const guidanceUrl = `/simplifi/guidance/${capture.id}`;
  const blueprint = parseBlueprintSummary(capture.blueprintSummary || capture.analysisSummary);

  return (
    <SimplifiProductShell
      active="inbox"
      slug={slug}
      loggedIn={Boolean(session)}
      brief={slice.brief}
      objects={slice.objects}
      actionCenter={slice.actionCenter}
      entityId={obj.id}
    >
      <main className="sw-main">
        <p className="sw-section-label">Opportunity profile</p>
        <header className="sw-priority-card">
          <div className="sw-priority-main">
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>{obj.title}</h1>
              <p className="sw-card-meta" style={{ marginTop: 8 }}>
                {obj.type}
                {obj.savePurpose ? ` · ${obj.savePurpose}` : ''}
                {obj.dateCaptured ? ` · captured ${obj.dateCaptured}` : ''}
              </p>
            </div>
            <span>{obj.opportunityScore != null ? `${obj.opportunityScore}/100` : obj.priority}</span>
          </div>
          <div className="sw-card-footer">
            <strong>{obj.nextAction}</strong>
            {obj.priorityLevel ? <span>{priorityLevelLabel(obj.priorityLevel)}</span> : null}
          </div>
        </header>

        <section className="sw-brief-grid">
          <article className="sw-brief-panel">
            <h2>Why this matters</h2>
            <p>{obj.whyThisMatters}</p>
          </article>
          <article className="sw-brief-panel">
            <h2>What most people do</h2>
            <p>{obj.whatMostPeopleDo}</p>
          </article>
        </section>

        <article className="sw-brief-panel sw-recommend">
          <h2>What we recommend</h2>
          <p>{obj.whatWeRecommend}</p>
          <p className="sw-next-action">
            Next: <strong>{obj.nextAction}</strong>
            {obj.dueDate ? ` · due ${obj.dueDate}` : ''}
          </p>
        </article>

        {(blueprint.meta.length > 0 || blueprint.sections.length > 0 || blueprint.roadmap.length > 0) && (
          <section className="sw-brief-panel" aria-label="Blueprint stub">
            <h2>Blueprint preview</h2>
            <p className="sw-muted">
              Early outline from capture analysis — react to this in the field; full delivery plans come later.
            </p>
            {blueprint.meta.length > 0 ? (
              <ul className="sw-event-list" style={{ marginTop: 12 }}>
                {blueprint.meta.slice(0, 6).map((line) => (
                  <li key={line}>
                    <div>
                      <p>{line}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {blueprint.sections.slice(0, 4).map((section) => (
              <article key={section.title} style={{ marginTop: 12 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{section.title}</h3>
                <p className="sw-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {section.content.slice(0, 480)}
                  {section.content.length > 480 ? '…' : ''}
                </p>
              </article>
            ))}
            {blueprint.roadmap.length > 0 ? (
              <ul className="sw-event-list" style={{ marginTop: 12 }}>
                {blueprint.roadmap.slice(0, 5).map((item) => (
                  <li key={`${item.phase}-${item.focus}`}>
                    <div>
                      <strong>{item.phase}</strong>
                      <p>{item.focus}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <p style={{ marginTop: 12 }}>
              <Link href={guidanceUrl} className="sw-link">
                Open guidance
              </Link>
              {obj.magnifiUrl || obj.considerUrl ? (
                <>
                  {' · '}
                  <Link href={obj.magnifiUrl || obj.considerUrl || guidanceUrl} className="sw-link">
                    Magnifi story
                  </Link>
                </>
              ) : null}
            </p>
          </section>
        )}

        <section className="sw-quick-actions" aria-label="Opportunity links">
          <Link href={guidanceUrl}>Guidance</Link>
          {obj.considerUrl ? <Link href={obj.considerUrl}>Magnifi</Link> : null}
          {obj.magnifiUrl ? <Link href={obj.magnifiUrl}>Story</Link> : null}
          {obj.sourceUrl ? (
            <a href={obj.sourceUrl} target="_blank" rel="noreferrer">
              Source
            </a>
          ) : null}
          <Link href="/simplifi/follow-ups">Follow-ups</Link>
          <Link href="/simplifi/workspace">Brief</Link>
        </section>

        {session ? (
          <OpportunityActions recordId={obj.id} dueDate={obj.dueDate} outcomeStatus={obj.outcomeStatus} />
        ) : (
          <p className="sw-muted">
            <Link href={`/simplifi/login?next=${encodeURIComponent(`/simplifi/opportunity/${obj.id}`)}`}>
              Sign in
            </Link>{' '}
            to snooze, record outcomes, or archive.
          </p>
        )}
      </main>
    </SimplifiProductShell>
  );
}
