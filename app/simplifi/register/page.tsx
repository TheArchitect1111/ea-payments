import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm';
import { SimplifiLegalGate } from './SimplifiLegalGate';
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
          <p className="pl-lede">
            Submit a request for Early Access. This does not create a live account until we approve
            you. Already approved?{' '}
            <Link href="/simplifi/login">Sign in</Link>
            {' · '}
            <Link href="/legal/privacy">Privacy Policy</Link>
          </p>
        </header>
        <SimplifiLegalGate>
          <RegisterForm realm="simplifi" />
        </SimplifiLegalGate>
      </div>
    </div>
  );
}
