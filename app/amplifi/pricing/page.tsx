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
    name: 'Social', price: '$29', label: 'A consistent presence', action: 'Start Social', href: '/amplifi/register?plan=amplifi_social', available: true,
    description: 'For the business that knows what it wants to say and needs help turning it into a steady social rhythm.',
    features: ['One brand workspace', 'Up to three social channels', 'AI-assisted posts and graphics', 'Brand voice profile', 'Content calendar and scheduling', 'Approve, edit, or reject', 'Direct publishing', 'Campaign results and tracked clicks'],
  },
  {
    name: 'Intelligence', price: '$59', label: 'Know what is worth saying', action: 'Request Intelligence access', href: '/contact?subject=Amplifi%20Intelligence%20access', available: false,
    description: 'For the team that wants Amplifi to watch selected subjects, identify useful signals, and turn them into timely content.',
    features: ['Everything in Social', 'Smart Research', 'Search once or keep watching', 'Source-backed content direction', 'Repeat-noise filtering', 'Research history and provenance', 'Opportunity alerts', 'Three watched subjects'],
  },
  {
    name: 'Complete', price: '$129', label: 'Your digital content operation', action: 'Request Complete access', href: '/contact?subject=Amplifi%20Complete%20access', available: false,
    description: 'For the organization that wants the complete guided loop, from research and campaign strategy through creation, approval, publishing, and learning.',
    features: ['Everything in Intelligence', 'Content Engine', 'Campaign Architect', 'Smartchitecture™ workflow', 'Approval and Autopilot rules', 'Exception Queue', 'Cross-channel campaign support', 'Learning Engine'],
  },
] as const;

export default function AmplifiPricingPage() {
  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation"><AmplifiBrand /><div><Link href="/amplifi">Product</Link><Link href="/portal/login?next=%2Famplifi%2Fworkspace">Sign in</Link></div></nav>

      <section className="am-pricing-hero">
        <div><p className="am-commerce-kicker">THREE WAYS TO GET YOUR TIME BACK</p><h1>Choose how much of the content workload Amplifi should carry.</h1></div>
        <p>Start with consistent social content. Add intelligence when you want Amplifi to find the story. Move to Complete when you want the full content operation working together.</p>
      </section>

      <section className="am-plan-grid" aria-label="Amplifi plans">
        {plans.map((plan, index) => (
          <article className={`am-plan${index === 1 ? ' am-plan-featured' : ''}`} key={plan.name}>
            {index === 1 ? <span className="am-plan-ribbon">MOST USEFUL FOR SMALL TEAMS</span> : null}
            <p className="am-plan-label">AMPLIFI {plan.name.toUpperCase()}</p>
            <h2>{plan.name}</h2><p className="am-plan-promise">{plan.label}</p>
            <p className="am-plan-price"><strong>{plan.price}</strong><span>/month</span></p>
            <p className="am-plan-description">{plan.description}</p>
            <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
            <Link href={plan.href} className={`am-plan-button${plan.available ? ' am-plan-button-live' : ''}`}>{plan.action}<span>→</span></Link>
            <small>{plan.available ? 'Available now. Secure checkout powered by Stripe.' : 'Guided launch access. We confirm fit before activation.'}</small>
          </article>
        ))}
      </section>

      <section className="am-value-section">
        <div><p className="am-commerce-kicker">THE BETTER QUESTION</p><h2>What does inconsistent visibility already cost you?</h2></div>
        <div><p>Missed follow-up</p><p>Last-minute content</p><p>Unclear messaging</p><p>Hours lost rebuilding the same process</p></div>
      </section>

      <section className="am-after-purchase">
        <p className="am-commerce-kicker">WHAT HAPPENS AFTER YOU SAY YES</p><h2>From payment to first campaign, Amplifi guides the setup.</h2>
        <ol><li><strong>Your workspace opens.</strong><span>Access is prepared automatically after payment.</span></li><li><strong>Amplifi learns your voice.</strong><span>Add your audience, goals, tone, website, channels, and time zone.</span></li><li><strong>You build the first campaign.</strong><span>Amplifi guides the topic, message, creative, and schedule.</span></li><li><strong>You approve the work.</strong><span>Nothing moves beyond the control level you choose.</span></li></ol>
      </section>
      <footer className="am-commerce-footer"><AmplifiBrand /><nav><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><Link href="/contact">Contact</Link></nav></footer>
    </main>
  );
}
