import Image from 'next/image';
import { SignIn } from '@clerk/nextjs';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function AdminClerkSignInPage() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">Admin sign in</h1>
          <p className="pl-lede">Sign in with Google or a one-time email link. No password to remember.</p>
        </header>

        <div className="pl-card" style={{ display: 'grid', justifyItems: 'center', gap: 16 }}>
          {clerkEnabled ? (
            <>
              <SignIn routing="hash" forceRedirectUrl="/admin/sign-in/complete" signUpUrl="/admin/sign-in" />
              <a className="pl-link" href="/admin/login">Use password instead</a>
            </>
          ) : (
            <>
              <p className="pl-error">Google sign-in is not configured yet. Use the password login.</p>
              <a className="pl-link" href="/admin/login">Go to password login</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
