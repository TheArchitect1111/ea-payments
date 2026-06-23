import SimplifiLoginClient from './SimplifiLoginClient';
import '../../portal/login/portal-login.css';
import './simplifi-auth.css';

export const metadata = {
  title: 'Simplifi Login · Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function SimplifiLoginPage() {
  return <SimplifiLoginClient />;
}
