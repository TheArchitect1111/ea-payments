import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiRegistrationForm from './AmplifiRegistrationForm';
import AmplifiBrand from '../AmplifiBrand';
import '../amplifi-commerce.css';
import '../amplifi-assets.css';

export const metadata: Metadata = {
  title: 'Begin with Amplifi Social | Guided workspace setup',
  description: 'Prepare your Amplifi Social workspace and begin a guided brand setup.',
};

export default function AmplifiRegisterPage() {
  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation">
        <AmplifiBrand />
        <div><Link href="/amplifi/pricing">Back to plans</Link></div>
      </nav>
      <section className="am-register-layout">
        <div className="am-register-intro">
          <div className="am-register-image"><div className="am-register-status"><span>✓</span><p><strong>Your next week of content</strong><small>Ready to build</small></p></div></div>
          <div className="am-register-copy"><p className="am-commerce-kicker">AMPLIFI SOCIAL</p><h1>Let’s prepare a workspace that fits the way you communicate.</h1><p>Share the basics below. After checkout, Amplifi will guide you through your voice, audience, channels, and first campaign.</p><div className="am-register-price"><strong>$29</strong><span>per month<br />cancel anytime</span></div><p className="am-register-promise"><strong>Your starting point:</strong> a guided way to shape, review, schedule, publish, and learn from your social content without rebuilding the process every week.</p></div>
        </div>
        <AmplifiRegistrationForm />
      </section>
    </main>
  );
}
