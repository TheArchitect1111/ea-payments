import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('cookie');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Cookie Policy'} — Efficiency Architects`,
  description: 'Cookie Policy — Ascension Systems Legal Document Pack v1.0.',
  alternates: { canonical: '/legal/cookies' },
};

export default function LegalCookiesPage() {
  return <LegalDocumentView docType="cookie" />;
}
