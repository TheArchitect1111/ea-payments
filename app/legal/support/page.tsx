import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('support');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Support Policy'} — Efficiency Architects`,
  description: 'Support Policy — Ascension Systems Legal Document Pack v1.0.',
  alternates: { canonical: '/legal/support' },
};

export default function LegalSupportPage() {
  return <LegalDocumentView docType="support" />;
}
