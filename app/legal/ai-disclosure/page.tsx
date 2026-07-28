import type { Metadata } from 'next';
import { LegalDocumentView } from '../LegalDocumentView';
import { getLegalDocument } from '@/lib/trust-engine/legal-pack';

const doc = getLegalDocument('ai_disclosure');

export const metadata: Metadata = {
  title: `${doc?.title ?? 'AI Disclosure'} — Efficiency Architects`,
  description: 'AI Disclosure for Ascension Systems / Efficiency Architects products.',
  alternates: { canonical: '/legal/ai-disclosure' },
};

export default function LegalAiDisclosurePage() {
  return <LegalDocumentView docType="ai_disclosure" />;
}
