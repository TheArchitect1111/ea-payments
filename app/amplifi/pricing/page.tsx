import type { Metadata } from 'next';
import Link from 'next/link';
import { getSubscriptionPlan } from '@/lib/subscription-catalog';
import '../amplifi-commerce.css';

export const metadata: Metadata = {
  title: 'Amplifi Social Pricing | Efficiency Architects',
  description: 'One practical plan to keep your social content moving for $29 per month.',
};

const included = [
  'One brand workspace',
  'Up to three social channels',
  'AI-assisted posts and graphics',
  'Brand voice profile',
  'Content calendar and scheduling',
  'Accept, edit, or reject controls',
  'Direct publishing when a channel is connected',
  'Campaign results and tracked clicks',
];

export default function AmplifiPricingPage() {
  const plan = getSubscriptionPlan('amplifi_social');
  const price = plan ? `$${Math.round(plan.priceCents / 100)}` : '$29';

  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation">
        <Link href="/amplifi" className="am-wordmark">AMPLIFI</Link>
        <Link href="/portal/login?next=%2Famplifi%2Fworkspace" className="am-nav-link">Sign in</Link>
      </nav>

      <section className="am-commerce-hero">
        <p className="am-commerce-kicker">AMPLIFI SOCIAL</p>
        <h1>Keep showing up without starting over every Monday.</h1>
        <p className="am-commerce-lead">
          Amplifi helps you shape, review, schedule, publish, and learn from your social content in one guided workspace.
        </p>
      </section>

      <section className="am-offer" aria-labelledby="amplifi-plan-title">
        <div className="am-offer-copy">
          <p className="am-commerce-kicker">ONE CLEAR STARTING POINT</p>
          <h2 id="amplifi-plan-title">Amplifi Social</h2>
          <p>Built for a business or organization that needs consistent communication without adding another full-time job.</p>
          <ul>
            {included.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="am-offer-action">
          <p className="am-price"><strong>{price}</strong><span>/month</span></p>
          <p>Cancel anytime. Your content does not publish without your approval.</p>
          <Link href="/amplifi/register?plan=amplifi_social" className="am-buy-button">
            Start with Amplifi Social
          </Link>
          <small>Secure checkout powered by Stripe.</small>
        </div>
      </section>

      <section className="am-after-purchase">
        <p className="am-commerce-kicker">WHAT HAPPENS NEXT</p>
        <h2>Pay once. Amplifi prepares the rest.</h2>
        <ol>
          <li><strong>Your workspace is created.</strong><span>Your organization and Amplifi access are provisioned automatically.</span></li>
          <li><strong>Your welcome email arrives.</strong><span>Use it to sign in and begin the guided brand setup.</span></li>
          <li><strong>You teach Amplifi your voice.</strong><span>Add your audience, goals, tone, website, channels, and time zone.</span></li>
          <li><strong>You create your first campaign.</strong><span>Review every message before anything is scheduled or published.</span></li>
        </ol>
      </section>

      <footer className="am-commerce-footer">
        <p>Amplifi™ by Efficiency Architects</p>
        <nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav>
      </footer>
    </main>
  );
}
