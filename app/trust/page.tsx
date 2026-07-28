import type { Metadata } from 'next';
import Link from 'next/link';
import { listActiveLegalDocuments } from '@/lib/trust-engine/legal-pack';
import '../landing.css';
import './trust-center.css';

export const metadata: Metadata = {
  title: 'Trust Center — Efficiency Architects',
  description:
    'Privacy, security, AI principles, and legal commitments from Ascension Systems / Efficiency Architects.',
  alternates: { canonical: '/trust' },
};

const SECTIONS = [
  {
    id: 'privacy',
    title: 'Privacy',
    lede: 'Your information is collected for capability — not for spectacle. We explain what we hold, why, and how you can ask us to delete it.',
    href: '/legal/privacy',
    linkLabel: 'Read Privacy Policy',
  },
  {
    id: 'security',
    title: 'Security',
    lede: 'Sessions are signed. Tenant data is scoped by organization. Payments run through Stripe. We design for quiet reliability, not theater.',
    href: '/legal/privacy',
    linkLabel: 'How we protect data',
  },
  {
    id: 'ai',
    title: 'AI Principles',
    lede: 'AI assists judgment; it does not replace accountability. Humans remain responsible for decisions that affect your business.',
    href: '/legal/ai-disclosure',
    linkLabel: 'AI Disclosure',
  },
  {
    id: 'support',
    title: 'Support',
    lede: 'When something breaks, you should know who answers and how quickly. Our Support Policy is written for operators, not lawyers.',
    href: '/legal/support',
    linkLabel: 'Support Policy',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    lede: 'We aim for clear hierarchy, readable type, and keyboard-friendly flows across portals and public pages — and we improve when you tell us where we fall short.',
    href: '/contact',
    linkLabel: 'Contact us',
  },
  {
    id: 'legal',
    title: 'Legal Documents',
    lede: 'One Legal Document Pack powers every EA product. Terms, Privacy, EULA, MSA, and SOW stay versioned in the Trust Engine.',
    href: '/legal/terms',
    linkLabel: 'Terms of Service',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    lede: 'Ascension Systems operates under North Carolina law. Contracts for professional services use our Master Services Agreement and Statements of Work.',
    href: '/legal/msa',
    linkLabel: 'Master Services Agreement',
  },
  {
    id: 'data',
    title: 'Data Handling',
    lede: 'Capture, portals, and assessments exist to move work forward. We do not sell personal information. Processors are limited to what the product requires.',
    href: '/legal/privacy',
    linkLabel: 'Data practices',
  },
  {
    id: 'cookies',
    title: 'Cookies',
    lede: 'Cookies keep you signed in and help us understand product reliability. Optional analytics stay optional.',
    href: '/legal/cookies',
    linkLabel: 'Cookie Policy',
  },
  {
    id: 'retention',
    title: 'Data Retention',
    lede: 'We keep records as long as your engagement requires — and delete or anonymize when you ask, subject to legal hold and payment history.',
    href: '/legal/privacy',
    linkLabel: 'Retention details',
  },
] as const;

export default function TrustCenterPage() {
  const docs = listActiveLegalDocuments();

  return (
    <main className="pl-site trust-center">
      <header className="pl-nav pl-nav-light">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <span>Efficiency Architects</span>
        </Link>
        <Link href="/legal/privacy" className="pl-nav-link">
          Privacy
        </Link>
        <Link href="/contact" className="pl-nav-link">
          Contact
        </Link>
      </header>

      <section className="trust-hero">
        <p className="pl-kicker">Trust Center</p>
        <h1>Built for confidence.</h1>
        <p className="trust-hero-lede">
          How Efficiency Architects protects your work, explains AI, and keeps legal commitments
          versioned — the same standards across Simplifi, Amplifi, Magnifi, and every portal.
        </p>
      </section>

      <div className="trust-sections">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="trust-section">
            <h2>{section.title}</h2>
            <p>{section.lede}</p>
            <Link href={section.href} className="trust-section-link">
              {section.linkLabel} →
            </Link>
          </section>
        ))}
      </div>

      <section className="trust-doc-index" aria-labelledby="trust-docs-heading">
        <h2 id="trust-docs-heading">Legal Document Pack</h2>
        <p className="trust-doc-lede">
          Canonical documents remain the source of truth. The Trust Center summarizes; the Legal Pack
          governs.
        </p>
        <ul>
          {docs.map((doc) => (
            <li key={doc.href}>
              <Link href={doc.href}>
                {doc.title}
                <span>
                  v{doc.version} · {doc.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="trust-footer-note">
        <Link href="/">← Efficiency Architects</Link>
      </p>
    </main>
  );
}
