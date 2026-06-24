import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata = { title: 'Cookie Policy — Efficiency Architects' };

export default function CookiesPage() {
  return (
    <LegalPageShell title="Cookie Policy" kicker="Legal">
      <p>Last updated: June 24, 2026</p>
      <p>
        Efficiency Architects uses essential cookies and similar technologies required for authentication, security,
        session continuity, and basic site functionality. We minimize non-essential tracking.
      </p>
      <h2>Types of cookies</h2>
      <ul>
        <li><strong>Essential:</strong> required for login, security, and core navigation</li>
        <li><strong>Functional:</strong> remember preferences that improve your experience</li>
        <li><strong>Analytics:</strong> used only where enabled to understand performance and reliability</li>
      </ul>
      <h2>Your choices</h2>
      <p>
        You can control cookies through your browser settings. Disabling essential cookies may limit portal or authenticated
        experiences.
      </p>
    </LegalPageShell>
  );
}
