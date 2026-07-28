import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('eula');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'EULA'} — Efficiency Architects`,
  description: 'Mobile App End User License Agreement — Ascension Systems Legal Pack v1.0.',
  alternates: { canonical: '/legal/eula' },
};

export default function LegalEulaPage() {
  return <LegalDocumentView docType="eula" />;
}
