import Image from 'next/image';
import AdminSignInForm from '@/components/auth/AdminSignInForm';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Sign In · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith('/admin') ? params.next : '/admin/master';

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">Admin sign in</h1>
          <p className="pl-lede">Sign in, register, or reset your password. Two-factor verification is required when email is configured.</p>
        </header>

        <div className="pl-card">
          {params.reset ? <p className="pl-success">Password updated. Sign in with your new password.</p> : null}
          {params.error ? <p className="pl-error">Invalid email or password.</p> : null}
          <AdminSignInForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}
