import { listEscalations } from '@/lib/ea-guide-store';
import { getAirtableApiKey } from '@/lib/integration-env';

export const dynamic = 'force-dynamic';

export default async function EAGuideAdminPage() {
  const escalations = await listEscalations(100);
  const open = escalations.filter((row) => row.status === 'open');
  const durable = Boolean(
    getAirtableApiKey() && (process.env.EA_GUIDE_AIRTABLE_TABLE ?? process.env.EACP_AIRTABLE_TABLE)?.trim(),
  );
  const ephemeral = !durable && (process.env.VERCEL === '1' || process.env.VERCEL === 'true');

  return (
    <main className="ea-guide-admin" data-ea-guide="dashboard">
      <header>
        <p className="ea-guide-admin-eyebrow">EA Guide&trade;</p>
        <h1>Guide escalations</h1>
        <p>Internal tasks created when the Orb cannot resolve a user issue. No help desk email required.</p>
        {ephemeral ? (
          <p className="ea-guide-admin-warn">
            Durable storage is not configured. Escalations still notify the team via Pulse, but this queue
            may not persist between requests. Set EA_GUIDE_AIRTABLE_TABLE (or EACP_AIRTABLE_TABLE) and
            AIRTABLE_API_KEY to enable durable persistence.
          </p>
        ) : null}
      </header>

      <section className="ea-guide-admin-stats">
        <div>
          <strong>{open.length}</strong>
          <span>Open</span>
        </div>
        <div>
          <strong>{escalations.length}</strong>
          <span>Total</span>
        </div>
      </section>

      <section className="ea-guide-admin-list">
        {escalations.length === 0 ? (
          <p className="ea-guide-admin-empty">No escalations yet. Users reach this page after trying guides or Q&amp;A.</p>
        ) : (
          <ul>
            {escalations.map((row) => (
              <li key={row.id}>
                <div className="ea-guide-admin-row-head">
                  <strong>{row.issueSummary}</strong>
                  <span className={`ea-guide-admin-status ea-guide-admin-status-${row.status}`}>{row.status}</span>
                </div>
                <p>
                  {row.portalType} · {row.role} · {row.page}
                  {row.workflow ? ` · ${row.workflow}` : ''}
                </p>
                {row.details ? <p className="ea-guide-admin-detail">{row.details}</p> : null}
                <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <style>{`
        .ea-guide-admin {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #171717;
        }
        .ea-guide-admin-eyebrow {
          color: #c9a844;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .ea-guide-admin h1 {
          margin: 8px 0;
          font-size: 1.8rem;
        }
        .ea-guide-admin-stats {
          display: flex;
          gap: 16px;
          margin: 24px 0;
        }
        .ea-guide-admin-stats div {
          min-width: 120px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(201, 168, 68, 0.1);
        }
        .ea-guide-admin-stats strong {
          display: block;
          font-size: 1.6rem;
        }
        .ea-guide-admin-list ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }
        .ea-guide-admin-list li {
          padding: 16px;
          border: 1px solid rgba(23, 23, 23, 0.1);
          border-radius: 12px;
          background: #fff;
        }
        .ea-guide-admin-row-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }
        .ea-guide-admin-status {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(201, 168, 68, 0.2);
        }
        .ea-guide-admin-status-open {
          background: rgba(220, 38, 38, 0.12);
          color: #b91c1c;
        }
        .ea-guide-admin-detail {
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .ea-guide-admin-empty {
          color: #64748b;
        }
        .ea-guide-admin-warn {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(220, 38, 38, 0.08);
          color: #b91c1c;
          font-size: 0.86rem;
          line-height: 1.5;
        }
      `}</style>
    </main>
  );
}
