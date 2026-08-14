import type { Metadata } from 'next';
import Link from 'next/link';
import AmplifiRegistrationForm from './AmplifiRegistrationForm';
import AmplifiBrand from '../AmplifiBrand';
import '../amplifi-commerce.css';
import '../amplifi-assets.css';

export const metadata: Metadata = {
  title: 'Begin with Amplifi | Guided workspace setup',
  description: 'Prepare your Amplifi workspace and begin a guided brand setup.',
};

const planDetails = {
  amplifi_social: {
    name: 'Social',
    price: '$29',
    promise: 'shape, review, schedule, and publish the social content you already know you need',
  },
  amplifi_intelligence: {
    name: 'Intelligence',
    price: '$59',
    promise: 'have Amplifi search for useful opportunities, create the posts, and keep your social channels moving',
  },
  amplifi_complete: {
    name: 'Complete',
    price: '$129',
    promise: 'carry the campaign from research and planning through approval, publishing, and learning',
  },
} as const;

type AmplifiPlanId = keyof typeof planDetails;

export default async function AmplifiRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const requested = (await searchParams).plan;
  const planId: AmplifiPlanId = requested && requested in planDetails
    ? requested as AmplifiPlanId
    : 'amplifi_social';
  const plan = planDetails[planId];
  return (
    <main className="am-commerce">
      <nav className="am-commerce-nav" aria-label="Amplifi navigation">
        <AmplifiBrand />
        <div><Link href="/amplifi/pricing">Back to plans</Link></div>
      </nav>
      <section className="am-register-layout">
        <div className="am-register-intro">
          <div className="am-register-image"><div className="am-register-status"><span>✓</span><p><strong>Your next week of content</strong><small>Ready to build</small></p></div></div>
          <div className="am-register-copy"><p className="am-commerce-kicker">AMPLIFI {plan.name.toUpperCase()}</p><h1>Let’s prepare a workspace that fits the way you communicate.</h1><p>Share the basics below. After checkout, Amplifi will guide you through your voice, audience, channels, and first campaign.</p><div className="am-register-price"><strong>{plan.price}</strong><span>per month<br />cancel anytime</span></div><p className="am-register-promise"><strong>Your starting point:</strong> a guided way to {plan.promise}.</p></div>
        </div>
        <AmplifiRegistrationForm planId={planId} />
      </section>
    </main>
  );
}
