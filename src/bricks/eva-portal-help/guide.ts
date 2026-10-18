import { loadPortalKnowledge } from './manifest-loader';
import { canReadEntry, type GuideRole } from './roles';
import { retrieveHelp } from './retriever';
import { escalationFor } from './escalate';
import { logUnanswered, type UnansweredWriter } from './logger';

export type GuideRequest = { portalId: string; role: GuideRole; question: string; entryKey?: string; stepIndex?: number };
export type GuideResponse = {
  ok: boolean; status: 'guided' | 'unanswered'; portalId: string; entryKey?: string;
  label?: string; step?: string; stepNumber?: number; totalSteps?: number;
  link?: string; nextStepIndex?: number | null; escalation: ReturnType<typeof escalationFor>;
  logged?: boolean; message?: string;
};
function verifiedLink(origin: string, href: string | null): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, origin);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}
export async function guideOneStep(request: GuideRequest, writer?: UnansweredWriter): Promise<GuideResponse> {
  const data = loadPortalKnowledge(request.portalId);
  const question = request.question.trim().slice(0, 500);
  const validStep = Number.isInteger(request.stepIndex) && (request.stepIndex ?? 0) >= 0;
  const continued = request.entryKey
    ? data.entries.find(e => e.key === request.entryKey && canReadEntry(e, request.role)) || null
    : null;
  const entry = continued || (!request.entryKey ? retrieveHelp(data, question, request.role)?.entry : null);
  const link = verifiedLink(data.origin, entry?.href || null);
  if (!entry || !link || !entry.steps.length || (request.entryKey && !validStep)) {
    const reason = request.entryKey ? 'Missing or unauthorized step reference' : 'No verified matching menu instruction';
    await logUnanswered(request.portalId, request.role, question, reason, writer);
    return { ok: false, status: 'unanswered', portalId: data.portalId, escalation: escalationFor(question, true),
      logged: true, message: 'I cannot verify that instruction here. I’ve flagged it for the team to review.' };
  }
  const index = Math.min(validStep ? request.stepIndex! : 0, entry.steps.length - 1);
  return { ok: true, status: 'guided', portalId: data.portalId, entryKey: entry.key,
    label: entry.label, step: entry.steps[index], stepNumber: index + 1, totalSteps: entry.steps.length,
    nextStepIndex: index + 1 < entry.steps.length ? index + 1 : null,
    link, escalation: escalationFor(question, false) };
}
