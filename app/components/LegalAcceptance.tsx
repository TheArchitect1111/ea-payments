'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { resolveOnboardingAcceptanceDocs } from '@/lib/trust-engine/legal-pack';
import type { ClientLegalProfile, LegalAcceptanceRecord, TrustProductId } from '@/lib/trust-engine/types';
import { NAVY, GOLD, CREAM } from '@/lib/design-system';

export type LegalAcceptanceProps = {
  productId: TrustProductId;
  userId: string;
  onAccepted: (records: LegalAcceptanceRecord[]) => void | Promise<void>;
  continueLabel?: string;
  profile?: ClientLegalProfile | null;
  onlyRequiring?: boolean;
  variant?: 'default' | 'premium';
};

export function LegalAcceptance({
  productId,
  userId,
  onAccepted,
  continueLabel = 'Continue',
  profile = null,
  onlyRequiring = false,
  variant = 'default',
}: LegalAcceptanceProps) {
  const docs = useMemo(() => {
    const all = resolveOnboardingAcceptanceDocs(productId);
    if (!onlyRequiring) return all;
    return all.filter((doc) => {
      const accepted = profile?.latestByDoc[doc.docType];
      return !accepted || accepted.version !== doc.version;
    });
  }, [productId, profile, onlyRequiring]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const allAccepted = docs.length > 0 && docs.every((doc) => checked[`${doc.docType}:${doc.version}`]);

  async function handleContinue() {
    if (!allAccepted || submitting) return;
    setSubmitting(true);
    const acceptedAt = new Date().toISOString();
    const records: LegalAcceptanceRecord[] = docs.map((doc) => ({
      userId,
      productId,
      docType: doc.docType,
      version: doc.version,
      acceptedAt,
      href: doc.href,
    }));
    try { await onAccepted(records); } finally { setSubmitting(false); }
  }

  if (docs.length === 0) return <p style={{ color: '#555' }}>No legal acknowledgements are configured for this product.</p>;

  const labelFor = (docType: string, title: string) =>
    docType === 'eula' ? 'End User License Agreement' :
    docType === 'tos' ? 'Terms of Service' :
    docType === 'ai_disclosure' ? 'AI Disclosure' : title;

  if (variant === 'premium') {
    return (
      <section aria-labelledby="legal-acceptance-title" className="mt-6 border-t border-[#E9E4DA] pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Final review</p>
            <h2 id="legal-acceptance-title" className="mt-1 text-base font-semibold text-[#17233B]">Accept the project terms</h2>
          </div>
          <span className="text-[10px] font-semibold text-neutral-400">{docs.length} required</span>
        </div>

        <div className="mt-4 divide-y divide-[#EEEAE2] rounded-2xl border border-[#E9E4DA] bg-[#FCFBF8] px-4">
          {docs.map((doc) => {
            const key = `${doc.docType}:${doc.version}`;
            return (
              <label key={key} className="flex cursor-pointer items-start gap-3 py-4">
                <input
                  type="checkbox"
                  checked={Boolean(checked[key])}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#17233B]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#17233B]">{labelFor(doc.docType, doc.title)}</span>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">
                    I have reviewed and accept this agreement.{' '}
                    <Link href={doc.href} target="_blank" rel="noreferrer" className="font-semibold underline decoration-[#C9A844] underline-offset-2">
                      View document
                    </Link>
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!allAccepted || submitting}
          onClick={() => void handleContinue()}
          className="mt-5 w-full rounded-full px-5 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-[#D8D5CF] disabled:text-neutral-500"
          style={allAccepted ? { backgroundColor: GOLD, color: NAVY } : undefined}
        >
          {submitting ? 'Saving acceptance…' : continueLabel}
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="legal-acceptance-title" style={{ background: CREAM, borderLeft: `3px solid ${NAVY}`, padding: '1.5rem 1.35rem', maxWidth: 560 }}>
      <h2 id="legal-acceptance-title" style={{ margin: 0, fontSize: '1.15rem', color: NAVY, fontWeight: 800 }}>Before continuing, please review</h2>
      <ul style={{ listStyle: 'none', margin: '1.25rem 0 0', padding: 0 }}>
        {docs.map((doc) => {
          const key = `${doc.docType}:${doc.version}`;
          return (
            <li key={key} style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.95rem', color: '#1a1a2e' }}>
                <input type="checkbox" checked={Boolean(checked[key])} onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))} style={{ marginTop: '0.2rem' }} />
                <span>{labelFor(doc.docType, doc.title)} <Link href={doc.href} target="_blank" rel="noreferrer" style={{ color: NAVY }}>(view)</Link><span style={{ display: 'block', fontSize: '0.75rem', color: '#777' }}>Version {doc.version}</span></span>
              </label>
            </li>
          );
        })}
      </ul>
      <button type="button" disabled={!allAccepted || submitting} onClick={() => void handleContinue()} style={{ marginTop: '1.25rem', padding: '0.75rem 1.35rem', border: 'none', background: allAccepted ? NAVY : '#c4c4c4', color: allAccepted ? GOLD : '#666', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem', cursor: allAccepted ? 'pointer' : 'not-allowed' }}>
        {submitting ? 'Saving…' : continueLabel}
      </button>
    </section>
  );
}
