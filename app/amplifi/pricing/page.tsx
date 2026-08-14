import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiBrand from '../AmplifiBrand';
import '../amplifi-commerce.css';

export const metadata: Metadata = {
  title: 'Amplifi Plans | Choose your content support level',
  description: 'Choose the Amplifi plan that matches how much content work you want the system to carry.',
};

const plans = [
  {
    name: 'Social', price: '$29', label: 'Help me stay consistent', action: 'Begin with Social', href: '/amplifi/register?plan=amplifi_social', available: true,
    description: 'A guided starting point when you already know what matters and want help shaping, approving, and sharing it consistently.',
    features: ['One brand workspace', 'Up to three social channels', 'AI-assisted posts and graphics', 'Brand voice profile', 'Content calendar and scheduling', 'Approve, edit, or reject', 'Direct publishing', 'Campaign results and tracked clicks'],
  },
  {
    name: 'Intelligence', price: '$59', label: 'Do the searching and creating for me', action: 'Begin with Intelligence', href: '/amplifi/register?plan=amplifi_intelligence', available: true,
    description: 'A guided step up when you want Amplifi to watch selected subjects, surface useful signals, and help you decide what deserves attention.',
    features: ['Everything in Social', 'Smart Research', 'Search once or keep watching', 'Source-backed content direction', 'Repeat-noise filtering', 'Research history and provenance', 'Opportunity alerts', 'Three watched subjects'],
  },
  {
    name: 'Complete', price: '$129', label: 'Run the whole campaign with me', action: 'Begin with Complete', href: '/amplifi/register?plan=amplifi_complete', available: true,
    description: 'The complete guided path when you want research, campaign planning, creation, approval, publishing, and learning to work together.',
    features: ['Everything in Intelligence', 'Content Engine', 'Campaign Architect', 'Smartchitecture™ workflow', 'Approval and Autopilot rules', 'Exception Queue', 'Cross-channel campaign support', 'Learning Engine'],
  },
] as const;

export default function AmplifiPricingPage() {
  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation"><AmplifiBrand /><div><Link href="/amplifi">Product</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

      <section className="am-pricing-hero">
        <div><p className="am-commerce-kicker">CHOOSE YOUR STARTING POINT</p><h1>Start with the kind of help you need now. Amplifi can grow with you.</h1></div>
        <p>Each plan follows the same guided rhythm. The difference is how much research, planning, and follow-through you want Amplifi to carry.</p>
      </section>

      <section className="am-plan-grid" aria-label="Amplifi plans">
        {plans.map((plan, index) => (
          <article className={`am-plan${index === 1 ? ' am-plan-featured' : ''}`} key={plan.name}>
            {index === 1 ? <span className="am-plan-ribbon">A GUIDED STEP UP</span> : null}
            <p className="am-plan-label">AMPLIFI {plan.name.toUpperCase()}</p>
            <h2>{plan.name}</h2><p className="am-plan-promise">{plan.label}</p>
            <p className="am-plan-price"><strong>{plan.price}</strong><span>/month</span></p>
            <p className="am-plan-description">{plan.description}</p>
            <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
            <Link href={plan.href} className={`am-plan-button${plan.available ? ' am-plan-button-live' : ''}`}>{plan.action}<span>→</span></Link>
            <small>Available now. Secure checkout powered by Stripe.</small>
          </article>
        ))}
      </section>

      <section className="am-value-section">
        <div><p className="am-commerce-kicker">NOT SURE WHERE TO BEGIN?</p><h2>Start with the part of the work that slows you down most.</h2></div>
        <div><p>Staying consistent</p><p>Finding the right story</p><p>Keeping the message on brand</p><p>Carrying work from idea to follow-through</p></div>
      </section>

      <section className="am-after-purchase">
        <p className="am-commerce-kicker">YOUR FIRST GUIDED STEPS</p><h2>Amplifi stays with you through setup and your first campaign.</h2>
        <ol><li><strong>Your workspace opens.</strong><span>Access is prepared automatically after payment.</span></li><li><strong>Amplifi learns your voice.</strong><span>Add your audience, goals, tone, website, channels, and time zone.</span></li><li><strong>You build the first campaign.</strong><span>Amplifi guides the topic, message, creative, and schedule.</span></li><li><strong>You approve the work.</strong><span>Nothing moves beyond the control level you choose.</span></li></ol>
      </section>
      <footer className="am-commerce-footer"><AmplifiBrand /><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
    </main>
  );
}
