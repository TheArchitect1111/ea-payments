import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('sow');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Statement of Work'} — Efficiency Architects`,
  description: 'Ascension Systems Statement of Work template v1.0.',
  alternates: { canonical: '/legal/sow' },
};

export default function LegalSowPage() {
  return <LegalDocumentView docType="sow" />;
}
