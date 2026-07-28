import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('msa');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'Master Services Agreement'} — Efficiency Architects`,
  description: 'Ascension Systems Master Services Agreement v1.0.',
  alternates: { canonical: '/legal/msa' },
};

export default function LegalMsaPage() {
  return <LegalDocumentView docType="msa" />;
}
