import Image from 'next/image';
import RegisterForm from '@/components/auth/RegisterForm';
import '../login/portal-login.css';

export const metadata = {
  title: 'Portal Register · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function PortalRegisterPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={240} height={240} className="pl-logo" priority />
          <p className="pl-eyebrow">Client Portal</p>
          <h1 className="pl-title">Register</h1>
          <p className="pl-lede">Request client portal access or start with the Operational MRI™ assessment.</p>
        </header>
        <RegisterForm realm="portal" />
      </div>
    </div>
  );
}
