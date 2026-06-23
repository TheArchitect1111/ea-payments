import Image from 'next/image';
import AuthNav from '@/components/auth/AuthNav';
import '../login/portal-login.css';

export const metadata = {
  title: 'Portal Password Reset · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function PortalForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={240} height={240} className="pl-logo" priority />
          <p className="pl-eyebrow">Client Portal</p>
          <h1 className="pl-title">Password reset</h1>
          <p className="pl-lede">Enter your portal email or username. If a matching account exists, we will email a reset link.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="portal" active="forgot-password" />
          {params.sent ? (
            <p className="pl-success">If an account matches, check your email for the reset link.</p>
          ) : null}
          {params.error ? <p className="pl-error">Could not send reset link. Please try again.</p> : null}
          <form action="/api/portal/password-reset/request" method="post" className="pl-form">
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
