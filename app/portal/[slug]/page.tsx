import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import PasswordChangeModal from './PasswordChangeModal';
import { PortalShell } from '@/lib/chassis/PortalShell';
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

  const session = await verifySession(token);
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

  const supportEmail = process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

  return (
    <div className="ep-page">
      <PortalShell slug={slug} active="home" />

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
          <p className="ep-card-title">Amplifi — Your Story</p>
          <div className="ep-placeholder">
            <p className="ep-placeholder-text">
              Share more. Reach more. See your amplification journey, latest Magnifi experience, and
              visibility roadmap.
            </p>
            <a href={`/portal/${slug}/amplifi`} className="ep-pulse-cta">
              Open Amplifi
            </a>
          </div>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Pulse — Your Progress</p>
          <div className="ep-placeholder">
            <p className="ep-placeholder-text">
              See your Capacity Score, Engagement Score, Training Completion, and
              Operational Health in one place.
            </p>
            <a href={`/portal/${slug}/pulse`} className="ep-pulse-cta">
              Open Pulse
            </a>
          </div>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Support</p>
          <div className="ep-placeholder">
            <p className="ep-placeholder-text">
              Questions? Reach your advisor at{' '}
              <a
                href={`mailto:${supportEmail}`}
                style={{ color: '#1B2B4D', fontWeight: 700 }}
              >
                {supportEmail}
              </a>
            </p>
          </div>
        </div>
      </main>
      {!client.passwordChanged && <PasswordChangeModal />}
    </div>
  );
}
