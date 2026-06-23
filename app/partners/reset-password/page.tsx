import Image from 'next/image';
import AuthNav from '@/components/auth/AuthNav';
import '../../portal/login/portal-login.css';
import '../partners.css';

export const metadata = {
  title: 'Set New Partner Password · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function PartnersResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ recordId?: string; slug?: string; token?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Partner Portal</p>
          <h1 className="pl-title">Set new password</h1>
          <p className="pl-lede">Choose a strong password with at least 10 characters, including letters and numbers.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="partner" active="forgot-password" />
          {params.error === 'mismatch' ? <p className="pl-error">Passwords do not match.</p> : null}
          {params.error === '1' ? <p className="pl-error">Reset link is invalid or expired.</p> : null}
          <form action="/api/partners/password-reset/complete" method="post" className="pl-form">
            <input type="hidden" name="recordId" value={params.recordId ?? ''} />
            <input type="hidden" name="slug" value={params.slug ?? ''} />
            <input type="hidden" name="token" value={params.token ?? ''} />
            <label className="pl-label" htmlFor="password">
              New password
            </label>
            <input id="password" name="password" type="password" className="pl-input" required autoFocus />
            <label className="pl-label" htmlFor="confirm">
              Confirm password
            </label>
            <input id="confirm" name="confirm" type="password" className="pl-input" required />
            <button type="submit" className="pl-btn">
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
