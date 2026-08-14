import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { captureToObject } from '@/lib/simplifi-objects';
import { computePriorityScore } from '@/lib/priority-engine';
import { parseBlueprintSummary } from '@/lib/blueprint-summary';
import { parseOpportunityPayload } from '@/lib/opportunity-experience';
import { formatDecisionPathLabel } from '@/lib/capture-success-flow';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { loadOrbWorkspaceSlice } from '@/lib/orb';
import { buildEvaluationSummary } from '@/lib/evaluation-summary';
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
  const intelligence = parseOpportunityPayload(capture)?.intelligence;
  const evaluation = buildEvaluationSummary(obj, ps);

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
        <p className="sw-section-label">Clear evaluation</p>
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
            <span>{evaluation.verdict}</span>
          </div>
        </header>

        <section className="sw-guided-evaluation" aria-label="Simplifi guidance">
          <p className="sw-guide-kicker">Here&apos;s what Simplifi sees</p>
          <h2>{evaluation.whatThisIs}</h2>
          <p className="sw-guide-verdict">{evaluation.verdict}</p>
          {evaluation.whyItMatters[0] ? <p className="sw-guide-reason">{evaluation.whyItMatters[0]}</p> : null}

          <div className="sw-guide-next">
            <span>Your next step</span>
            <strong>{evaluation.nextMove}</strong>
            {obj.dueDate ? <small>Target date: {obj.dueDate}</small> : null}
          </div>

          <div className="sw-guide-actions">
            <Link href={guidanceUrl} className="sw-guide-primary">Show me what to do</Link>
            <Link href="/simplifi/follow-ups" className="sw-guide-secondary">Remind me later</Link>
          </div>

          <details className="sw-guide-steps">
            <summary>See the three-step plan</summary>
            <ol>
              {evaluation.nextSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </details>
        </section>

        <details className="sw-brief-panel" aria-label="Detailed analysis">
          <summary style={{ cursor: 'pointer', fontWeight: 800 }}>View detailed analysis</summary>
          <div style={{ marginTop: 18 }}>
          {ps.reasons.length > 0 ? (
          <section aria-label="Why now">
            <h2>Why now</h2>
            <ul className="sw-event-list" style={{ marginTop: 8 }}>
              {ps.reasons.map((reason) => (
                <li key={reason}>
                  <div>
                    <p>{reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="sw-brief-grid" style={{ marginTop: 18 }}>
          <article>
            <h2>Why this matters</h2>
            <p>{obj.whyThisMatters}</p>
          </article>
          <article>
            <h2>What most people do</h2>
            <p>{obj.whatMostPeopleDo}</p>
          </article>
        </section>

        <article style={{ marginTop: 18 }}>
          <h2>What we recommend</h2>
          <p>{obj.whatWeRecommend}</p>
          <p className="sw-next-action">
            Next: <strong>{obj.nextAction}</strong>
            {obj.dueDate ? ` · due ${obj.dueDate}` : ''}
          </p>
        </article>

        {intelligence ? (
          <section style={{ marginTop: 18 }} aria-label="Decision and Build Intelligence">
            <h2>Decision Intelligence</h2>
            <p className="sw-muted" style={{ marginBottom: 8 }}>
              Computed when you captured this — how to pursue the opportunity.
            </p>
            <p>
              <strong>{formatDecisionPathLabel(intelligence.decision.recommendedPath)}</strong>
              {` · ${intelligence.decision.confidenceScore}% confidence · risk ${intelligence.decision.riskLevel}`}
            </p>
            <p style={{ marginTop: 8 }}>{intelligence.decision.pathRationale}</p>
            {intelligence.decision.possibilityHighlights.length > 0 ? (
              <ul className="sw-event-list" style={{ marginTop: 12 }}>
                {intelligence.decision.possibilityHighlights.slice(0, 4).map((line) => (
                  <li key={line}>
                    <div>
                      <p>{line}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <h3 style={{ margin: '16px 0 6px', fontSize: '1.05rem' }}>Build Intelligence</h3>
            <p>
              <strong>{intelligence.build.buildPath}</strong>
              {` · overlay ${intelligence.build.overlayConfidence.overall}`}
            </p>
            {intelligence.build.recommendedStack?.length ? (
              <p className="sw-muted" style={{ marginTop: 8 }}>
                Stack: {intelligence.build.recommendedStack.slice(0, 5).join(' · ')}
              </p>
            ) : null}
          </section>
        ) : (
          <section style={{ marginTop: 18 }}>
            <h2>Decision Intelligence</h2>
            <p className="sw-muted">
              Not on this capture yet. Use Intelligence under Next moves after a fresh capture.
            </p>
          </section>
        )}

        {(blueprint.meta.length > 0 || blueprint.sections.length > 0 || blueprint.roadmap.length > 0) && (
          <section style={{ marginTop: 18 }} aria-label="Blueprint preview">
            <h2>Blueprint preview</h2>
            <p className="sw-muted">
              Early outline from this capture — not a full delivery plan. Use guidance or return to
              your Brief for the next step.
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

        <section className="sw-quick-actions" style={{ marginTop: 18 }} aria-label="Opportunity links">
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
          </div>
        </details>

      </main>
    </SimplifiProductShell>
  );
}
