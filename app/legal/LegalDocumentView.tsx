import LegalPageShell from '@/app/components/landing/LegalPageShell';
import { renderLegalMarkdown } from '@/lib/legal/render-markdown-basic';
import { loadLegalMarkdown } from '@/lib/legal/load-legal-source';
import {
  getLegalDocument,
  listActiveLegalDocuments,
} from '@/lib/trust-engine/legal-pack';
import type { TrustLegalDocType } from '@/lib/trust-engine/types';
import Link from 'next/link';

/** Strip the first H1 from markdown — shell already shows the title. */
function stripLeadingH1(md: string): string {
  return md.replace(/^#\s+[^\n]+\n+/, '');
}

export function LegalDocumentView({ docType }: { docType: TrustLegalDocType }) {
  const doc = getLegalDocument(docType);
  if (!doc) {
    return (
      <LegalPageShell title="Document not found" kicker="Legal">
        <p>This legal document is not available.</p>
      </LegalPageShell>
    );
  }

  const md = stripLeadingH1(loadLegalMarkdown(doc.sourcePath));
  const html = renderLegalMarkdown(md);
  const siblings = listActiveLegalDocuments();

  return (
    <LegalPageShell title={doc.title} kicker="Legal Pack">
      <p className="pl-legal-meta">
        Version {doc.version} · Effective {doc.effectiveDate} · Last updated {doc.lastUpdated} ·{' '}
        {doc.status}
      </p>
      <nav className="pl-legal-toc" aria-label="Legal documents">
        {siblings.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.docType === docType ? 'is-active' : undefined}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <div
        className="pl-legal-markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="pl-legal-print-hint">Tip: Use your browser Print dialog for a printable copy.</p>
    </LegalPageShell>
  );
}
