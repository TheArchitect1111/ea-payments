import Image from 'next/image';
import RealmLoginCard from '@/components/auth/RealmLoginCard';import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

function errorMessage(code?: string): string | null {
  switch (code) {
    case 'expired':
      return 'That login link expired. Request a new one below.';
    case 'unauthorized':
      return 'That email is not registered as an EA admin.';
    case 'config':
      return 'Admin login is not configured. Set ADMIN_SESSION_SECRET on Vercel Production.';
    default:
      return null;
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith('/admin') ? params.next : '/admin/master';
  const error = errorMessage(params.error);

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">Admin sign in</h1>
          <p className="pl-lede">One email, one tap — no password to remember.</p>
        </header>

        <RealmLoginCard
          realm="admin"
          next={nextPath}
          error={error}
          showTitle={false}
          subtitle="Enter your admin email. We will send a one-tap login link."
          buttonLabel="Email me a login link"
        />      </div>
    </div>
  );
}
