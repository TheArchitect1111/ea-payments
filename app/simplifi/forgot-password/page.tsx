import Link from 'next/link';
import AuthNav from '@/components/auth/AuthNav';
import '../../portal/login/portal-login.css';
import '../login/simplifi-auth.css';

export const metadata = {
  title: 'Simplifi Password Reset · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function SimplifiForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
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
          <h1 className="pl-title">Reset Simplifi password</h1>
          <p className="pl-lede">Enter your Simplifi email or username. If an account exists, we will email a reset link.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="simplifi" active="forgot-password" />
          {params.sent ? (
            <p className="pl-success">If an account matches, check your email for the reset link.</p>
          ) : null}
          {params.error ? <p className="pl-error">Could not send reset link. Please try again.</p> : null}
          <form action="/api/simplifi/password-reset/request" method="post" className="pl-form">
            <label className="pl-label" htmlFor="identifier">
              Email or username
            </label>
            <input id="identifier" name="identifier" type="text" className="pl-input" required autoFocus />
            <button type="submit" className="pl-btn">
              Send reset link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
