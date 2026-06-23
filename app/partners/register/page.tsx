import Image from 'next/image';
import RegisterForm from '@/components/auth/RegisterForm';
import '../../portal/login/portal-login.css';
import '../partners.css';

export const metadata = {
  title: 'Partner Register · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function PartnersRegisterPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Partner Portal</p>
          <h1 className="pl-title">Register</h1>
          <p className="pl-lede">Request access to the EA partner network.</p>
        </header>
        <RegisterForm realm="partner" />
      </div>
    </div>
  );
}
