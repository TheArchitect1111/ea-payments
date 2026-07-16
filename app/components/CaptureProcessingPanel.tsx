'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CaptureApiResponse } from '@/lib/capture-response';
import { pollCaptureUntilReady } from '@/lib/capture-polling';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';
import ActiveSavePanel from '@/app/components/ActiveSavePanel';
import { clearProcessingCaptureId } from '@/lib/capture-upload-limits';

export default function CaptureProcessingPanel({
  captureId,
  title,
  onComplete,
  onError,
  autoOpenMagnifi = true,
  showActiveSave = false,
  variant = 'default',
  workspaceHref = '/simplifi/workspace',
}: {
  captureId: string;
  title?: string;
  onComplete?: (response: CaptureApiResponse) => void;
  onError?: (message: string) => void;
  autoOpenMagnifi?: boolean;
  showActiveSave?: boolean;
  variant?: 'default' | 'capture';
  workspaceHref?: string;
}) {
  const [message, setMessage] = useState('Analyzing in the background…');
  const [result, setResult] = useState<CaptureApiResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    pollCaptureUntilReady(captureId, (tick) => {
      if (cancelled) return;
      if (tick.status === 'Analyzing') {
        setMessage('Simplifi is scoring your capture. Magnifi builds automatically…');
      }
    })
      .then((response) => {
        if (cancelled) return;
        clearProcessingCaptureId();
        setResult(response);
        setMessage('');
        onComplete?.(response);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Amplifi — Your story is ready', {
            body: response.record?.title ?? title ?? 'Open Magnifi to view your capture.',
            tag: `capture-${captureId}`,
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Capture failed.';
        setFailed(true);
        setTimedOut(/longer than expected/i.test(msg));
        setMessage(msg);
        onError?.(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [captureId, onComplete, onError, title]);

  if (result?.record) {
    return (
      <div className={variant === 'capture' ? 'sc-processing-result' : 'space-y-3'}>
        {showActiveSave && (
          <ActiveSavePanel
            recordId={result.record.id}
            title={result.record.title ?? title ?? 'Opportunity'}
          />
        )}
        <CaptureSuccessPanel
          title={result.record.title ?? title ?? 'Opportunity'}
          links={{
            magnifiUrl: result.magnifiUrl,
            considerUrl: result.considerUrl,
            guidanceUrl: result.guidanceUrl,
            workspaceUrl: result.workspaceUrl,
            clientMessage: result.clientMessage,
          }}
          amplifiDraft={result.amplifiDraft}
          autoOpenMagnifi={autoOpenMagnifi}
        />
      </div>
    );
  }

  if (variant === 'capture') {
    return (
      <div className="sc-processing-status">
        <p className="sc-processing-kicker">{failed ? 'Capture issue' : 'Processing'}</p>
        <p className={failed ? 'sc-error' : 'sc-processing-message'}>{message}</p>
        {!failed && <p className="sc-processing-hint">Magnifi builds automatically when scoring finishes.</p>}
        {failed ? (
          <p className="sc-processing-hint" style={{ marginTop: '0.75rem' }}>
            {timedOut ? (
              <>
                Your capture may still finish in the background.{' '}
                <Link href={workspaceHref} className="sc-inline-link">
                  Open workspace
                </Link>
              </>
            ) : (
              <>
                You can try again, or{' '}
                <Link href={workspaceHref} className="sc-inline-link">
                  check your workspace
                </Link>
                .
              </>
            )}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">
        {failed ? 'Capture issue' : 'Processing in background'}
      </p>
      <p className={`text-sm ${failed ? 'text-red-600' : 'text-neutral-600'}`}>{message}</p>
      {!failed && (
        <p className="text-xs text-neutral-500">
          You can keep browsing. We&apos;ll notify you here and by email when Magnifi is ready.
        </p>
      )}
      {failed ? (
        <p className="text-xs text-neutral-600">
          <Link href={workspaceHref} className="font-semibold underline">
            Open Simplifi workspace
          </Link>
          {timedOut ? ' — analysis may still complete there.' : '.'}
        </p>
      ) : null}
    </div>
  );
}
