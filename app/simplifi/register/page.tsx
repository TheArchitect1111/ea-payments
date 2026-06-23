import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import '../../portal/login/portal-login.css';
import '../login/simplifi-auth.css';

export const metadata = {
  title: 'Simplifi Register · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function SimplifiRegisterPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Link href="/simplifi" className="simplifi-auth-brand">
            SIMPLIFI
          </Link>
          <p className="pl-eyebrow">Early Access</p>
          <h1 className="pl-title">Request Simplifi access</h1>
          <p className="pl-lede">Ask for a workspace, or start with the assessment if you are still mapping the right EA path.</p>
        </header>
        <RegisterForm realm="simplifi" />
      </div>
    </div>
  );
}
