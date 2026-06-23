import Image from 'next/image';
import RegisterForm from '@/components/auth/RegisterForm';
import '../../portal/login/portal-login.css';

export const metadata = {
  title: 'Admin Register · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function AdminRegisterPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Master Portal</p>
          <h1 className="pl-title">Register</h1>
          <p className="pl-lede">Request admin access to the Master Control portal.</p>
        </header>
        <RegisterForm realm="admin" />
      </div>
    </div>
  );
}
