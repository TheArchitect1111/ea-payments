import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('privacy');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Privacy Policy'} — Efficiency Architects`,
  description:
    'Ascension Systems / Efficiency Architects Privacy Policy — platform Legal Document Pack v1.0.',
  alternates: { canonical: '/legal/privacy' },
};

export default function LegalPrivacyPage() {
  return <LegalDocumentView docType="privacy" />;
}
