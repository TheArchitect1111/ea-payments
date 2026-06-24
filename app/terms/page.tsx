import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata = { title: 'Terms of Service — Efficiency Architects' };

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" kicker="Legal">
      <p>Last updated: June 24, 2026</p>
      <p>
        By using Efficiency Architects websites, assessments, portals, and related services, you agree to these terms.
        Services are provided for organizational and professional use subject to applicable agreements, statements of work,
        and local law.
      </p>
      <h2>Use of services</h2>
      <p>
        You agree to provide accurate information, use services lawfully, and respect intellectual property, confidentiality,
        and security requirements communicated during onboarding.
      </p>
      <h2>Limitation</h2>
      <p>
        Unless otherwise stated in a signed agreement, services are provided as-is to the extent permitted by law. See our
        Disclaimer for additional context.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href="mailto:freedom@efficiencyarchitects.online">freedom@efficiencyarchitects.online</a>.
      </p>
    </LegalPageShell>
  );
}
