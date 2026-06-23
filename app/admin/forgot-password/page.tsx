import Image from 'next/image';
import AuthNav from '@/components/auth/AuthNav';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Password Reset · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function AdminForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">Password reset</h1>
          <p className="pl-lede">Enter your admin email. If an account exists, we will send a reset link.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="admin" active="forgot-password" />
          {params.sent ? (
            <p className="pl-success">If an account matches, check your email for the reset link.</p>
          ) : null}
          {params.error ? <p className="pl-error">Could not send reset link. Please try again.</p> : null}
          <form action="/api/admin/password-reset/request" method="post" className="pl-form">
            <label className="pl-label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" className="pl-input" required autoFocus />
            <button type="submit" className="pl-btn">
              Send reset link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
