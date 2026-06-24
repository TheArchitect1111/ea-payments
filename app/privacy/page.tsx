import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata = { title: 'Privacy Policy — Efficiency Architects' };

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" kicker="Legal">
      <p>Last updated: June 24, 2026</p>
      <p>
        Efficiency Architects respects your privacy. We collect information you voluntarily provide through forms,
        assessments, client portals, and support requests in order to deliver services, respond to inquiries, and
        improve our offerings.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Contact details such as name, email, organization, and role</li>
        <li>Assessment responses and operational context you choose to share</li>
        <li>Usage data required to operate secure client experiences</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>Deliver assessments, proposals, and client services</li>
        <li>Respond to contact and support requests</li>
        <li>Maintain security, compliance, and service quality</li>
      </ul>
      <h2>Contact</h2>
      <p>
        For privacy questions, email{' '}
        <a href="mailto:freedom@efficiencyarchitects.online">freedom@efficiencyarchitects.online</a>.
      </p>
    </LegalPageShell>
  );
}
