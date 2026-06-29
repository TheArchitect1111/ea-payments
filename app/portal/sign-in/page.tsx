import Image from 'next/image';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import '../login/portal-login.css';

export const metadata = {
  title: 'Portal Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function PortalClerkSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const nextPath =
    params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/simplifi/capture';
  const completeUrl = `/portal/sign-in/complete?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/simplifi-logo.png" alt="Simplifi" width={320} height={180} className="pl-logo" priority />
          <p className="pl-eyebrow">Client Portal</p>
          <h1 className="pl-title">Sign in with Google or email link</h1>
          <p className="pl-lede">Use the same email address we have on file for your portal. No password to remember.</p>
        </header>

        <div className="pl-card" style={{ display: 'grid', justifyItems: 'center', gap: 16 }}>
          {clerkEnabled ? (
            <>
              <SignIn routing="hash" forceRedirectUrl={completeUrl} signUpUrl="/portal/sign-in" />
              <Link className="pl-link" href={`/portal/login?next=${encodeURIComponent(nextPath)}`}>
                Use password instead
              </Link>
            </>
          ) : (
            <>
              <p className="pl-error">Google sign-in is not configured yet.</p>
              <Link className="pl-link" href="/portal/login">Go to password login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
