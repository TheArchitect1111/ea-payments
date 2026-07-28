import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('tos');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Terms of Service'} — Efficiency Architects`,
  description: 'Ascension Systems Terms of Service — platform Legal Document Pack v1.0.',
  alternates: { canonical: '/legal/terms' },
};

export default function LegalTermsPage() {
  return <LegalDocumentView docType="tos" />;
}
