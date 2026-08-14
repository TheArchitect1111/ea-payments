import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiRegistrationForm from './AmplifiRegistrationForm';
import AmplifiBrand from '../AmplifiBrand';
import '../amplifi-commerce.css';
import '../amplifi-assets.css';

export const metadata: Metadata = {
  title: 'Start Amplifi Social | Your workspace begins here',
  description: 'Create your Amplifi Social subscription and begin guided brand setup.',
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
          <div className="am-register-copy"><p className="am-commerce-kicker">AMPLIFI SOCIAL</p><h1>Give your content a place to keep moving.</h1><p>Tell us who the workspace belongs to. After secure checkout, Amplifi prepares your access and walks you through your brand setup.</p><div className="am-register-price"><strong>$29</strong><span>per month<br />cancel anytime</span></div><p className="am-register-promise"><strong>What you are buying:</strong> a repeatable way to shape, approve, schedule, publish, and learn from your social content without rebuilding the process every week.</p></div>
        </div>
        <AmplifiRegistrationForm />
      </section>
    </main>
  );
}
