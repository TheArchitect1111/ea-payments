import type { HelpEntry, LoadedKnowledge } from './manifest-loader';
import { canReadEntry, type GuideRole } from './roles';

type KnowledgeManifestWithRouting = LoadedKnowledge['manifest'] & { helpQuestionRouting?: Record<string, string> };
const STOP = new Set(['how', 'do', 'i', 'we', 'a', 'an', 'the', 'and', 'or', 'to', 'my', 'our', 'is', 'are', 'can', 'where', 'what', 'why', 'from', 'with', 'on', 'in', 'of', 'for', 'it', 'me', 'get', 'does', 'this', 'that', 'please', 'today']);
const FAMILIES = [
  ['video', 'lesson', 'classroom', 'recording'],
  ['course', 'class', 'training', 'program', 'academy'],
  ['certificate', 'certification'],
  ['download', 'resource', 'materials', 'document', 'file'],
  ['appointment', 'book', 'booking', 'jane', 'schedule', 'reschedule'],
  ['review', 'approve', 'approval'],
  ['submission', 'application', 'applicant', 'intake'],
  ['tracking', 'shipping', 'fulfillment', 'order'],
  ['edit', 'change', 'update', 'manage', 'settings'],
  ['waitlist', 'register', 'enroll', 'enrollment'],
  ['eva', 'assistant', 'help']
];
function words(s: string): Set<string> {
  const raw = s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) || [];
  return new Set(raw.map(w => { const family = FAMILIES.find(list => list.includes(w)); return family ? family[0] : w; }).filter(w => w.length > 2 && !STOP.has(w)));
}
function tokens(e: HelpEntry): Set<string> {
  const raw = e.raw;
  const lines = [e.label, e.behavior || '', e.location || '', String(raw.id || ''),
    String(raw.control || ''), String(raw.section || ''), String(raw.button || ''),
    String(raw.description || ''), String(raw.action || '')];
  return words(lines.join(' '));
}
export type Retrieval = { entry: HelpEntry; score: number } | null;
export function retrieveHelp(data: LoadedKnowledge, question: string, role: GuideRole): Retrieval {
  // Audited unanswered questions must be explicitly resolved in manifest data.
  // A keyword-only guess cannot convert a known help gap into an instruction.
  const audited = data.manifest.questionsEvaCannotReliablyAnswerToday?.some(item => item.question.trim().toLowerCase() === question.trim().toLowerCase());
  if (audited) {
    const routing = (data.manifest as KnowledgeManifestWithRouting).helpQuestionRouting || {};
    const key = Object.entries(routing).find(([q]) => q.trim().toLowerCase() === question.trim().toLowerCase())?.[1];
    const entry = key ? data.entries.find(item => item.key === key) : undefined;
    return entry && canReadEntry(entry, role) && entry.href && entry.steps.length ? { entry, score: 100 } : null;
  }
  const q = words(question);
  if (q.size === 0) return null;
  const candidates = data.entries.filter(entry => canReadEntry(entry, role) && entry.href && entry.steps.length > 0);
  const scored = candidates.map(entry => {
    const terms = tokens(entry);
    const nameTerms = words(entry.label);
    let hits = 0;
    for (const t of q) if (terms.has(t)) hits += nameTerms.has(t) ? 2.5 : 1;
    const overlap = [...q].filter(t => terms.has(t)).length;
    const score = hits / Math.max(1, q.size) + (overlap >= 2 ? 0.35 : 0);
    return { entry, score, overlap };
  }).filter(c => c.overlap > 0 && c.score >= 0.8)
    .sort((a,b) => b.score - a.score || a.entry.key.localeCompare(b.entry.key));
  if (scored.length === 0) return null;
  const best = scored[0];
  // An isolated generic keyword such as "class" is not enough for a reliable instruction.
  if (best.overlap === 1 && q.size > 2 && best.score < 1.25) return null;
  // Refuse ambiguous ties across unrelated actions rather than guessing the correct menu.
  if (scored[1] && best.score - scored[1].score < 0.001 &&
      best.entry.href !== scored[1].entry.href && best.entry.label !== scored[1].entry.label) return null;
  return { entry: best.entry, score: best.score };
}
