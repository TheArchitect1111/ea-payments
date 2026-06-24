import LegalPageShell from '@/app/components/landing/LegalPageShell';

export const metadata = { title: 'Disclaimer — Efficiency Architects' };

export default function DisclaimerPage() {
  return (
    <LegalPageShell title="Disclaimer" kicker="Legal">
      <p>Last updated: June 24, 2026</p>
      <p>
        Content on this website is provided for informational and educational purposes. It does not constitute legal,
        financial, or professional advice. Outcomes described in stories or examples reflect specific contexts and are not
        guarantees of future results.
      </p>
      <p>
        Operational assessments, proposals, and implementation services are governed by the agreements executed with each
        client. Features, timelines, and availability may change as products evolve.
      </p>
      <p>
        Questions: <a href="mailto:freedom@efficiencyarchitects.online">freedom@efficiencyarchitects.online</a>.
      </p>
    </LegalPageShell>
  );
}
