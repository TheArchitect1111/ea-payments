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
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const errorMessage =
    params.error === 'email'
      ? 'We found your account but could not send the email. Check that Resend is configured for this site.'
      : params.error === 'config'
        ? 'Password reset is not fully configured on the server yet. Try Sign in with Google instead, or contact support.'
        : params.error
          ? 'Could not send reset link. Please try again.'
          : '';

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
          {errorMessage ? <p className="pl-error">{errorMessage}</p> : null}
          {clerkEnabled ? (
            <>
              <a className="pl-google-btn" href="/admin/sign-in">Sign in with Google or email link</a>
              <p className="pl-or">or request a password reset</p>
            </>
          ) : null}
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
