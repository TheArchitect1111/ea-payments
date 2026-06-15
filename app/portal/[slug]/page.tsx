import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import './ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;

  if (!token) {
    redirect(`/portal/login`);
  }

  const session = verifySession(token);
  if (!session) {
    redirect(`/portal/login`);
  }

  if (session.slug !== slug) {
    redirect(`/portal/${session.slug}`);
  }

  const client = await getClientByPortalSlug(slug);
  if (!client) {
    notFound();
  }

  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  const paymentDateFormatted = client.paymentDate
    ? new Date(client.paymentDate + 'T12:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const amountFormatted =
    client.amountPaid > 0
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(client.amountPaid)
      : 'N/A';

  const isActive = client.portalAccessStatus === 'Active';

  return (
    <div className="ep-page">
      <header className="ep-header">
        <div className="ep-header-brand">
          <span className="ep-header-label">Client Portal</span>
          <span className="ep-header-name">Efficiency Architects</span>
        </div>
        <a href="/api/portal/logout" className="ep-logout">
          Sign Out
        </a>
      </header>

      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Welcome Back</p>
          <h1 className="ep-welcome-heading">Hello, {firstName}</h1>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Account Overview</p>
          <table className="ep-info-table">
            <tbody>
              <tr>
                <td className="ep-info-label">Name</td>
                <td className="ep-info-value">{client.clientName}</td>
              </tr>
              {client.organization && (
                <tr>
                  <td className="ep-info-label">Organization</td>
                  <td className="ep-info-value">{client.organization}</td>
                </tr>
              )}
              <tr>
                <td className="ep-info-label">Package</td>
                <td className="ep-info-value">{client.packagePurchased}</td>
              </tr>
              <tr>
                <td className="ep-info-label">Member Since</td>
                <td className="ep-info-value">{paymentDateFormatted}</td>
              </tr>
              {client.amountPaid > 0 && (
                <tr>
                  <td className="ep-info-label">Amount Paid</td>
                  <td className="ep-info-value">{amountFormatted}</td>
                </tr>
              )}
              <tr>
                <td className="ep-info-label">Portal Access</td>
                <td className="ep-info-value">
                  <span className={`ep-status ${isActive ? 'ep-status-active' : 'ep-status-pending'}`}>
                    {client.portalAccessStatus}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Resources</p>
          <div className="ep-placeholder">
            <p className="ep-placeholder-text">
              Your advisor will populate this section with documents, deliverables, and next steps
              as your engagement progresses.
            </p>
          </div>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Support</p>
          <div className="ep-placeholder">
            <p className="ep-placeholder-text">
              Questions? Reach your advisor at{' '}
              <a
                href="mailto:freedom@efficiencyarchitects.online"
                style={{ color: '#1B2B4D', fontWeight: 700 }}
              >
                freedom@efficiencyarchitects.online
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
