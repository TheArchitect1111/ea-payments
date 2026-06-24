import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata = { title: 'Accessibility Statement — Efficiency Architects' };

export default function AccessibilityPage() {
  return (
    <LegalPageShell title="Accessibility Statement" kicker="Legal">
      <p>Last updated: June 24, 2026</p>
      <p>
        Efficiency Architects is committed to improving accessibility across our public website and client experiences.
        We aim to conform with WCAG 2.1 Level AA guidelines over time and welcome feedback when barriers remain.
      </p>
      <h2>Our approach</h2>
      <ul>
        <li>Readable typography, color contrast, and responsive layouts on mobile devices</li>
        <li>Descriptive alt text for meaningful imagery</li>
        <li>Keyboard-accessible navigation and form controls</li>
        <li>Ongoing audits as content and features evolve</li>
      </ul>
      <h2>Feedback</h2>
      <p>
        If you encounter an accessibility barrier, contact{' '}
        <a href="mailto:freedom@efficiencyarchitects.online">freedom@efficiencyarchitects.online</a> or use our{' '}
        <a href="/contact">contact form</a>.
      </p>
    </LegalPageShell>
  );
}
