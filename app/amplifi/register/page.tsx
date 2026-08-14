import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiRegistrationForm from './AmplifiRegistrationForm';
import '../amplifi-commerce.css';

export const metadata: Metadata = {
  title: 'Start Amplifi Social | Efficiency Architects',
  description: 'Create your Amplifi Social subscription and begin guided brand setup.',
};

export default function AmplifiRegisterPage() {
  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation">
        <Link href="/amplifi" className="am-wordmark">AMPLIFI</Link>
        <Link href="/amplifi/pricing" className="am-nav-link">Back to pricing</Link>
      </nav>
      <section className="am-register-layout">
        <div className="am-register-intro">
          <p className="am-commerce-kicker">AMPLIFI SOCIAL</p>
          <h1>Let Amplifi carry the content workload with you.</h1>
          <p>Tell us who the workspace belongs to. Stripe handles payment securely, then Amplifi creates your account and guides you into brand setup.</p>
          <div className="am-register-price"><strong>$29</strong><span>per month</span></div>
          <ul>
            <li>One brand</li>
            <li>Up to three channels</li>
            <li>Guided creation and approval</li>
            <li>Scheduling, publishing, and results</li>
          </ul>
        </div>
        <AmplifiRegistrationForm />
      </section>
    </main>
  );
}
