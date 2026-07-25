'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  formatDecisionPathLabel,
  openMagnifiExperience,
  shareAmplifiLink,
  type CaptureSuccessInsight,
  type CaptureSuccessLinks,
} from '@/lib/capture-success-flow';
import {
  absoluteAmplifiShareUrl,
  MAGNIFI_PUBLIC_LINK_WARNING,
  preferPortalMagnifiUrl,
} from '@/lib/amplifi-share-policy';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import {
  activeSaveCapture,
  createWatchListItem,
  snoozeCapture,
} from '@/lib/simplifi-client';
import ActiveSavePanel from '@/app/components/ActiveSavePanel';
import StoryDraftPanel from '@/app/components/StoryDraftPanel';
import '@/app/components/story-draft-panel.css';

export default function CaptureSuccessPanel({
  title,
  links,
  amplifiDraft,
  onClose,
  onContinue,
  recordId,
  loggedIn = false,
  insight,
}: {
  title: string;
  links: CaptureSuccessLinks;
  amplifiDraft?: AmplifiSocialDraft;
  onClose?: () => void;
  onContinue?: () => void;
  recordId?: string;
  loggedIn?: boolean;
  insight?: CaptureSuccessInsight;
  autoOpenMagnifi?: boolean;
}) {
  const [shareNote, setShareNote] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [watched, setWatched] = useState(false);
  const [reminded, setReminded] = useState(false);

  const preferredShare =
    preferPortalMagnifiUrl({
      magnifiUrl: links.magnifiUrl,
      considerUrl: links.considerUrl,
      captureId: recordId,
    }) ?? '';
  const storyUrl = preferredShare
    ? preferredShare.startsWith('/')
      ? absoluteAmplifiShareUrl(preferredShare)
      : preferredShare
    : '';
  const amplifiHref =
    storyUrl && title
      ? `/amplifi?${new URLSearchParams({ url: storyUrl, title, ...(recordId ? { capture: recordId } : {}) }).toString()}`
      : recordId
        ? `/amplifi?capture=${encodeURIComponent(recordId)}`
        : '/amplifi';
  const opportunityUrl =
    links.opportunityUrl ?? (recordId ? `/simplifi/opportunity/${recordId}` : undefined);
  const briefUrl = links.workspaceUrl ?? '/simplifi/workspace';
  const canAct = Boolean(loggedIn && recordId);

  const openMagnifi = () => {
    if (!links.magnifiUrl) return;
    openMagnifiExperience(links.magnifiUrl);
  };

  const shareStory = async () => {
    if (!storyUrl) return;
    const result = await shareAmplifiLink(storyUrl, title);
    setShareNote(
      result === 'shared'
        ? `Shared. ${MAGNIFI_PUBLIC_LINK_WARNING}`
        : `Link copied. ${MAGNIFI_PUBLIC_LINK_WARNING}`,
    );
  };

  const goBrief = () => {
    onContinue?.();
    onClose?.();
    if (typeof window !== 'undefined') {
      window.location.href = briefUrl;
    }
  };

  const addToWatchList = async () => {
    if (!canAct || !recordId || watched) return;
    setBusy('watch');
    setActionNote('');
    try {
      const data = await createWatchListItem({
        title,
        url: storyUrl || links.considerUrl || links.magnifiUrl,
        source: 'capture-success',
        notes: insight?.nextAction ? `Next: ${insight.nextAction}` : undefined,
        category: 'opportunity',
      });
      if (!data.ok) {
        setActionNote(data.error ?? 'Could not add to Watch List. Sign in and try again.');
        return;
      }
      setWatched(true);
      setActionNote('On your Watch List — it will stay on your radar.');
    } catch {
      setActionNote('Network error adding to Watch List.');
    } finally {
      setBusy(null);
    }
  };

  const snoozeWeek = async () => {
    if (!canAct || !recordId) return;
    setBusy('snooze');
    setActionNote('');
    try {
      const data = await snoozeCapture(recordId, 7);
      if (!data.ok) {
        setActionNote(data.error ?? 'Could not set reminder.');
        return;
      }
      setReminded(true);
      setActionNote(`Reminder set — follow up by ${data.dueDate ?? 'next week'}.`);
    } catch {
      setActionNote('Network error setting reminder.');
    } finally {
      setBusy(null);
    }
  };

  const quickFollowUp = async () => {
    if (!canAct || !recordId) return;
    setBusy('followup');
    setActionNote('');
    try {
      const data = await activeSaveCapture({
        recordId,
        purpose: 'review-later',
      });
      if (!data.ok) {
        setActionNote(data.error ?? 'Could not schedule follow-up.');
        return;
      }
      setReminded(true);
      setActionNote(`Follow-up saved · due ${data.dueDate ?? 'soon'}. Opens on Brief & Follow-ups.`);
    } catch {
      setActionNote('Network error saving follow-up.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">Nice capture</p>
      <div>
        <p className="text-lg font-extrabold text-[#1B2B4D]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Saved and scored. Choose one next move — then return to your Brief.
        </p>
      </div>

      {(insight?.decisionPath || insight?.opportunityScore != null || insight?.nextAction) && (
        <div
          className="rounded-xl border border-neutral-200 px-3 py-3 text-sm text-[#1B2B4D]"
          style={{ background: 'rgba(27, 43, 77, 0.04)' }}
        >
          {insight.decisionPath ? (
            <p className="font-bold">
              Path: {formatDecisionPathLabel(insight.decisionPath)}
              {insight.decisionConfidence != null ? ` · ${insight.decisionConfidence}%` : ''}
            </p>
          ) : null}
          {insight.decisionRationale ? (
            <p className="mt-1 text-neutral-600">{insight.decisionRationale}</p>
          ) : null}
          {insight.opportunityScore != null ? (
            <p className="mt-1 font-semibold">Opportunity score {insight.opportunityScore}/100</p>
          ) : null}
          {insight.nextAction ? (
            <p className="mt-1">
              Next: <strong>{insight.nextAction}</strong>
            </p>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full rounded-full bg-[#C9A844] py-3 text-sm font-extrabold text-[#1B2B4D]"
          onClick={goBrief}
        >
          Open Brief
        </button>

        {opportunityUrl ? (
          <Link
            href={opportunityUrl}
            className="block w-full rounded-full bg-[#1B2B4D] py-3 text-center text-sm font-extrabold text-[#C9A844]"
            onClick={() => {
              onContinue?.();
              onClose?.();
            }}
          >
            Opportunity profile
          </Link>
        ) : null}

        {canAct ? (
          <>
            <button
              type="button"
              className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D] disabled:opacity-50"
              disabled={busy !== null || watched}
              onClick={() => void addToWatchList()}
            >
              {watched ? 'On Watch List' : busy === 'watch' ? 'Adding…' : 'Add to Watch List'}
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D] disabled:opacity-50"
              disabled={busy !== null || reminded}
              onClick={() => void quickFollowUp()}
            >
              {reminded ? 'Follow-up set' : busy === 'followup' ? 'Saving…' : 'Follow up later'}
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D] disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => void snoozeWeek()}
            >
              {busy === 'snooze' ? 'Setting…' : 'Remind me in 7 days'}
            </button>
            <button
              type="button"
              className="w-full rounded-full border border-dashed border-neutral-300 py-2 text-sm font-semibold text-neutral-600"
              onClick={() => setShowFollowUp((v) => !v)}
            >
              {showFollowUp ? 'Hide custom follow-up' : 'Custom purpose & date'}
            </button>
          </>
        ) : (
          <p className="text-xs text-neutral-600">
            <Link href={`/simplifi/login?next=${encodeURIComponent(briefUrl)}`} className="font-bold underline">
              Sign in
            </Link>{' '}
            to add Watch List items and reminders.
          </p>
        )}

        {(links.considerUrl || links.magnifiUrl) && (
          <>
            <button
              type="button"
              className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D]"
              onClick={() => void shareStory()}
            >
              Share with someone
            </button>
            <p className="text-xs text-neutral-500 text-center px-2">{MAGNIFI_PUBLIC_LINK_WARNING}</p>
            {links.magnifiUrl ? (
              <button
                type="button"
                className="w-full rounded-full border border-neutral-200 py-3 text-sm font-bold text-[#1B2B4D]"
                onClick={openMagnifi}
              >
                Preview Magnifi story
              </button>
            ) : null}
            <Link
              href={amplifiHref}
              className="block w-full rounded-full border border-neutral-200 py-3 text-center text-sm font-bold text-[#1B2B4D]"
            >
              Post on social — Amplifi
            </Link>
          </>
        )}

        {links.guidanceUrl ? (
          <Link
            href={links.guidanceUrl}
            className="block w-full rounded-full border border-neutral-200 py-3 text-center text-sm font-bold text-[#1B2B4D]"
          >
            Open guidance
          </Link>
        ) : null}
      </div>

      {canAct && showFollowUp && recordId ? (
        <ActiveSavePanel
          recordId={recordId}
          title={title}
          onSaved={() => {
            setReminded(true);
            setActionNote('Custom follow-up saved. It appears on Follow-ups and your Brief.');
          }}
        />
      ) : null}

      {amplifiDraft ? <StoryDraftPanel draft={amplifiDraft} /> : null}

      {actionNote ? <p className="text-xs font-semibold text-[#1B2B4D]">{actionNote}</p> : null}
      {shareNote ? <p className="text-xs text-neutral-600">{shareNote}</p> : null}
    </div>
  );
}
