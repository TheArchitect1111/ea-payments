import type { CaptureRecord } from './capture-records';
import { buildGuidanceTriple } from './guidance-triple';

export type SimplifiObjectStatus = 'active' | 'triaged' | 'archived' | 'analyzing';

export interface SimplifiObject {
  id: string;
  captureId: string;
  title: string;
  type: CaptureRecord['captureType'];
  status: SimplifiObjectStatus;
  priority: CaptureRecord['priority'];
  sourceUrl?: string;
  dateCaptured: string;
  opportunityScore?: number;
  nextAction: string;
  dueDate?: string;
  owner?: string;
  savePurpose?: string;
  saveReason?: string;
  whyThisMatters: string;
  whatMostPeopleDo: string;
  whatWeRecommend: string;
  considerUrl?: string;
  magnifiUrl?: string;
  shareUrl?: string;
}

function mapStatus(status: CaptureRecord['status']): SimplifiObjectStatus {
  if (status === 'Analyzing') return 'analyzing';
  if (status === 'Archived') return 'archived';
  if (status === 'Triaged' || status === 'Routed') return 'triaged';
  return 'active';
}

export function captureToObject(capture: CaptureRecord, baseUrl?: string): SimplifiObject {
  const triple =
    capture.whyThisMatters && capture.whatWeRecommend
      ? {
          whyThisMatters: capture.whyThisMatters,
          whatMostPeopleDo: capture.whatMostPeopleDo ?? 'Save and forget.',
          whatWeRecommend: capture.whatWeRecommend,
          nextAction: capture.nextAction ?? 'Review capture',
          suggestedDueDate: capture.dueDate ?? '',
        }
      : buildGuidanceTriple(capture);

  const base = baseUrl?.replace(/\/$/, '') ?? '';
  const considerUrl =
    capture.considerSlug && base ? `${base}/consider/${capture.considerSlug}` : undefined;
  const magnifiUrl = capture.considerSlug && base ? `${base}/magnifi/${capture.id}` : undefined;

  return {
    id: capture.id,
    captureId: capture.captureId,
    title: capture.title,
    type: capture.captureType,
    status: mapStatus(capture.status),
    priority: capture.priority,
    sourceUrl: capture.sourceUrl,
    dateCaptured: capture.dateCaptured,
    opportunityScore: capture.opportunityScore,
    nextAction: capture.nextAction ?? triple.nextAction,
    dueDate: capture.dueDate ?? triple.suggestedDueDate,
    owner: capture.owner,
    savePurpose: capture.savePurpose,
    saveReason: capture.saveReason,
    whyThisMatters: triple.whyThisMatters,
    whatMostPeopleDo: triple.whatMostPeopleDo,
    whatWeRecommend: triple.whatWeRecommend,
    considerUrl,
    magnifiUrl,
    shareUrl: capture.shareUrl,
  };
}

export function sortInbox(objects: SimplifiObject[]): SimplifiObject[] {
  const priorityOrder = { High: 0, Normal: 1, Low: 2 };
  return [...objects].sort((a, b) => {
    if (a.status === 'analyzing' && b.status !== 'analyzing') return -1;
    if (b.status === 'analyzing' && a.status !== 'analyzing') return 1;
    const pa = priorityOrder[a.priority] ?? 1;
    const pb = priorityOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    const scoreA = a.opportunityScore ?? 0;
    const scoreB = b.opportunityScore ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.dateCaptured).getTime() - new Date(a.dateCaptured).getTime();
  });
}

export interface DailyBriefItem {
  id: string;
  title: string;
  detail: string;
  href?: string;
  kind: 'momentum' | 'deadline' | 'explore';
}

export function buildDailyBrief(objects: SimplifiObject[], firstName: string): {
  greeting: string;
  items: DailyBriefItem[];
  recommendedNext: { label: string; href: string } | null;
} {
  const sorted = sortInbox(objects);
  const top = sorted.filter((o) => o.status !== 'archived').slice(0, 6);

  const items: DailyBriefItem[] = [];

  const highMomentum = top.filter((o) => (o.opportunityScore ?? 0) >= 55).slice(0, 3);
  for (const o of highMomentum) {
    items.push({
      id: `m-${o.id}`,
      title: o.title,
      detail: 'Showing momentum — worth a focused next step.',
      href: o.considerUrl ?? o.shareUrl,
      kind: 'momentum',
    });
  }

  const dueSoon = top.filter((o) => o.dueDate).slice(0, 2);
  for (const o of dueSoon) {
    items.push({
      id: `d-${o.id}`,
      title: o.nextAction,
      detail: `Target: ${o.dueDate}`,
      href: o.considerUrl ?? '/capture',
      kind: 'deadline',
    });
  }

  const explore = top.find((o) => !highMomentum.includes(o));
  if (explore) {
    items.push({
      id: `e-${explore.id}`,
      title: explore.title,
      detail: explore.whyThisMatters.slice(0, 120),
      href: explore.considerUrl ?? '/capture',
      kind: 'explore',
    });
  }

  const first = sorted[0];
  const recommendedNext = first
    ? {
        label: first.nextAction,
        href: first.considerUrl ?? first.shareUrl ?? '/capture',
      }
    : { label: 'Capture something worth exploring', href: '/capture' };

  return {
    greeting: `Good morning${firstName ? `, ${firstName}` : ''}.`,
    items: items.slice(0, 5),
    recommendedNext,
  };
}
