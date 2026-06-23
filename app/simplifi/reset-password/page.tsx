import Link from 'next/link';
import AuthNav from '@/components/auth/AuthNav';
import '../../portal/login/portal-login.css';
import '../login/simplifi-auth.css';

export const metadata = {
  title: 'Set New Simplifi Password · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function SimplifiResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ recordId?: string; token?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Link href="/simplifi" className="simplifi-auth-brand">
            SIMPLIFI
          </Link>
          <p className="pl-eyebrow">Account Recovery</p>
          <h1 className="pl-title">Set new password</h1>
          <p className="pl-lede">Choose a strong password with at least 10 characters, including letters and numbers.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="simplifi" active="forgot-password" />
          {params.error === 'mismatch' ? <p className="pl-error">Passwords do not match.</p> : null}
          {params.error === '1' ? <p className="pl-error">Reset link is invalid or expired.</p> : null}
          <form action="/api/simplifi/password-reset/complete" method="post" className="pl-form">
            <input type="hidden" name="recordId" value={params.recordId ?? ''} />
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
