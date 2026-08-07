/**
 * Universal copy-quality checks + section repair for UXG public surfaces.
 * Subject-agnostic. Rejects repetition, leaks, fake proof, and malformed text.
 */
import {
  containsForbiddenPublicCopy,
  scrubForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import {
  detectOrgAttributedToSubject,
  type StructuredEvidenceModel,
} from '@/lib/uxg/evidence-model';

const GENERIC_AI =
  /\b(in today's (?:fast[- ]paced|ever[- ]changing) world|unlock your potential|delve into|elevate your|seamless(ly)?|cutting[- ]edge|game[- ]changer|transformative journey|holistic approach|leverage synergies|empower communities to thrive)\b/i;

const CONFIDENCE_LEAK =
  /\b(verified claim|confidence:\s*|source:\s*https?:|citation:|according to our research|we believe based on limited|admin clarification|not unverified)\b/i;

const MARKDOWN_LEAK = /(?:^|\n)\s{0,3}#{1,6}\s|(?:\*\*|__)[^*_\n]+(?:\*\*|__)|\[([^\]]+)\]\((https?:[^)]+)\)|```/;

const FAKE_PROOF =
  /\b(\d{2,}%\s+(?:of\s+)?(?:patients|clients|customers|members)|award[- ]winning|best in (?:the )?class|#1\b|guaranteed results|testimonial:|“[^”]{12,}”\s*—)/i;

const TRUNCATED = /\b(…|\.{3})\s*$|,\s*$|:\s*$|—\s*$/;

/** Short chrome labels (nav notes, eyebrows, CTA chips) — not paragraph copy. */
function isChromeLabel(path: string, text: string): boolean {
  if (text.length <= 48) return true;
  return /\.(eyebrow|brandNote|ctaLabel|primaryLabel|secondaryLabel|label|oneTitle|twoTitle|threeTitle|title)$/i.test(
    path,
  ) && text.length <= 72;
}

export type CopyIssue = {
  code: string;
  message: string;
  path?: string;
};

export type PublicCopyBundle = {
  fields: Record<string, string>;
  websiteFields?: Record<string, string>;
  portalFields?: Record<string, string>;
};

export type CopyQualityResult = {
  ok: boolean;
  issues: CopyIssue[];
};

function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceChunks(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 28);
}

function hasMalformedCapitalization(value: string): boolean {
  if (value.length > 24 && value === value.toUpperCase() && /[A-Z]{8,}/.test(value)) {
    return true;
  }
  if (/[a-z][A-Z]{2,}[a-z]/.test(value) && !/\b[A-Z]{2,}\b/.test(value)) {
    return true;
  }
  return false;
}

function hasDuplicatedFragment(value: string): boolean {
  const norm = normalizeForCompare(value);
  if (norm.length < 40) return false;
  const half = Math.floor(norm.length / 2);
  const a = norm.slice(0, half).trim();
  const b = norm.slice(half).trim();
  if (a.length >= 18 && a === b) return true;
  const words = norm.split(' ');
  for (let n = 8; n <= 14; n++) {
    for (let i = 0; i + n * 2 <= words.length; i++) {
      const left = words.slice(i, i + n).join(' ');
      const right = words.slice(i + n, i + n * 2).join(' ');
      if (left === right) return true;
    }
  }
  return false;
}

export function evaluatePublicCopyQuality(
  bundle: PublicCopyBundle,
  model?: StructuredEvidenceModel,
): CopyQualityResult {
  const issues: CopyIssue[] = [];
  const entries = Object.entries(bundle.fields).filter(
    ([, v]) => typeof v === 'string' && v.trim(),
  );

  const seenSentences = new Map<string, string>();

  if (model?.subjectIdentity) {
    const needle = model.subjectIdentity.toLowerCase();
    let count = 0;
    for (const [, text] of entries) {
      const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      count += text.match(re)?.length || 0;
    }
    if (count > 36) {
      issues.push({
        code: 'repeated_subject_name',
        message: `Subject name repeated ${count} times across public copy.`,
      });
    }
  }

  if (model?.verifiedRole && model.verifiedRole.length >= 6) {
    let roleCount = 0;
    const role = model.verifiedRole.toLowerCase();
    for (const [, text] of entries) {
      const re = new RegExp(role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      roleCount += text.match(re)?.length || 0;
    }
    if (roleCount > 22) {
      issues.push({
        code: 'repeated_role',
        message: `Role title repeated ${roleCount} times across public copy.`,
      });
    }
  }

  for (const [path, raw] of entries) {
    const text = raw.trim();
    if (containsForbiddenPublicCopy(text)) {
      issues.push({
        code: 'forbidden_copy',
        message: `Forbidden or internal copy at ${path}`,
        path,
      });
    }
    if (GENERIC_AI.test(text)) {
      issues.push({ code: 'generic_ai', message: `Generic AI phrasing at ${path}`, path });
    }
    if (CONFIDENCE_LEAK.test(text)) {
      issues.push({
        code: 'confidence_leak',
        message: `Citation/confidence language in public copy at ${path}`,
        path,
      });
    }
    if (MARKDOWN_LEAK.test(text)) {
      issues.push({ code: 'markdown_leak', message: `Markdown leakage at ${path}`, path });
    }
    if (FAKE_PROOF.test(text)) {
      issues.push({
        code: 'fake_proof',
        message: `Unsupported metric, quote, or testimonial at ${path}`,
        path,
      });
    }
    // Decorative empty metrics are not public claims.
    if (/metric(One|Two|Three)Value$/i.test(path) && /^[\s—–\-…\.]+$/.test(text)) {
      continue;
    }
    if (TRUNCATED.test(text) && text.length < 80) {
      issues.push({ code: 'truncated', message: `Truncated text at ${path}`, path });
    }
    if (hasMalformedCapitalization(text)) {
      issues.push({
        code: 'malformed_caps',
        message: `Malformed capitalization at ${path}`,
        path,
      });
    }
    if (hasDuplicatedFragment(text)) {
      issues.push({
        code: 'duplicated_fragment',
        message: `Duplicated fragment at ${path}`,
        path,
      });
    }
    if (model) {
      const mistype = detectOrgAttributedToSubject(text, model);
      if (mistype) {
        issues.push({ code: 'org_as_personal', message: mistype, path });
      }
    }

    if (isChromeLabel(path, text)) continue;

    for (const sentence of sentenceChunks(text)) {
      const key = normalizeForCompare(sentence);
      if (key.length < 28) continue;
      const prior = seenSentences.get(key);
      if (prior && prior !== path) {
        issues.push({
          code: 'repeated_sentence',
          message: `Repeated sentence across ${prior} and ${path}`,
          path,
        });
      } else if (!prior) {
        seenSentences.set(key, path);
      }
    }
  }

  if (bundle.websiteFields && bundle.portalFields) {
    const webSentences = new Set<string>();
    for (const text of Object.values(bundle.websiteFields)) {
      for (const s of sentenceChunks(text)) {
        webSentences.add(normalizeForCompare(s));
      }
    }
    for (const [path, text] of Object.entries(bundle.portalFields)) {
      for (const s of sentenceChunks(text)) {
        const key = normalizeForCompare(s);
        if (key.length >= 28 && webSentences.has(key)) {
          issues.push({
            code: 'portal_repeats_website',
            message: `Portal copy repeats website sentence at ${path}`,
            path,
          });
          break;
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

const REPAIR_VARIANTS = [
  (subject: string, role?: string, org?: string) =>
    role && org
      ? `${subject} serves as ${role} with ${org}.`
      : role
        ? `${subject} serves as ${role}.`
        : `${subject} helps people take a clear next step.`,
  (subject: string, role?: string, org?: string) =>
    org
      ? `This introduction centers on ${subject}${role ? ` in the ${role} role` : ''} alongside ${org}.`
      : `This introduction centers on ${subject} and the people they serve.`,
  (_s: string, _r?: string, org?: string) =>
    org
      ? `${org} provides coordinated support; individual roles help people understand and access it.`
      : 'Organization pathways are described from verified evidence only.',
  () => 'Expect a clear introduction, then one practical next conversation.',
  () => 'Use this private workspace for tools, progress, messages, and documents.',
  () => 'Track progress and choose the next action when you are ready.',
  () => 'Geography and history follow verified organization signals.',
  () => 'Contact paths listed here come from verified organization evidence.',
];

export function repairPublicCopyBundle(
  bundle: PublicCopyBundle,
  model: StructuredEvidenceModel,
  issues: CopyIssue[],
): PublicCopyBundle {
  const failing = [...new Set(issues.map((i) => i.path).filter(Boolean) as string[])];
  const next: Record<string, string> = { ...bundle.fields };
  const subject = model.subjectIdentity;
  const role = model.verifiedRole;
  const org = model.verifiedOrganization;
  let variant = 0;

  const nextVariant = (preferPortal = false) => {
    const pick = REPAIR_VARIANTS[(variant + (preferPortal ? 4 : 0)) % REPAIR_VARIANTS.length]!;
    variant += 1;
    return (
      scrubForbiddenPublicCopy(pick(subject, role, org)) ||
      `${subject} — clear next step.`
    );
  };

  for (const path of failing) {
    const lower = path.toLowerCase();
    const current = next[path] || '';

    if (lower.startsWith('portal.')) {
      if (lower.includes('brandheadline') || lower.endsWith('.title')) {
        next[path] =
          scrubForbiddenPublicCopy(
            role ? `${role} workspace` : `${subject} workspace`,
          ) || `${subject} workspace`;
      } else if (lower.includes('purpose') || lower.includes('brandsubhead') || lower.includes('memberwhere')) {
        next[path] = nextVariant(true);
      } else if (lower.includes('tone') || lower.includes('composition')) {
        next[path] = 'Private continuity after the public introduction';
      } else if (lower.includes('membernext') || lower.includes('cta')) {
        next[path] = 'Open tools, check progress, or send a message when ready.';
      } else {
        next[path] = nextVariant(true);
      }
      continue;
    }

    if (isChromeLabel(path, current) || lower.endsWith('.title') || lower.endsWith('.label')) {
      if (containsForbiddenPublicCopy(current) || GENERIC_AI.test(current) || CONFIDENCE_LEAK.test(current)) {
        if (lower.includes('cta') || lower.includes('label')) {
          next[path] = 'Start a conversation';
        } else if (lower.includes('title') || lower.includes('headline')) {
          next[path] =
            scrubForbiddenPublicCopy(
              role ? `${role}${org ? ` · ${org}` : ''}` : `Meet ${subject}`,
            ) || `Meet ${subject}`;
        } else {
          next[path] = scrubForbiddenPublicCopy(org || role || subject) || subject;
        }
        continue;
      }
      if (lower.includes('brandnote') || lower.includes('eyebrow')) {
        next[path] = scrubForbiddenPublicCopy(org || role || subject) || subject;
      } else if (lower.includes('ctalabel') || lower.endsWith('.label')) {
        next[path] = 'Start a conversation';
      }
      continue;
    }
    if (lower.includes('portal')) {
      next[path] = nextVariant(true);
    } else if (lower.includes('caption')) {
      next[path] = 'Environmental imagery for context — not a personal likeness.';
    } else if (lower.includes('note') && lower.includes('props')) {
      next[path] = org
        ? `Services described here are provided by ${org}.`
        : 'Organization services are attributed to the organization.';
    } else {
      next[path] = nextVariant(false);
    }
  }

  // Final uniqueness pass for long paragraph fields.
  const used = new Set<string>();
  for (const [path, text] of Object.entries(next)) {
    if (isChromeLabel(path, text)) continue;
    const key = normalizeForCompare(text);
    if (key.length < 28) continue;
    if (used.has(key)) {
      next[path] = nextVariant(path.toLowerCase().includes('portal'));
    } else {
      used.add(key);
    }
  }

  return {
    fields: next,
    websiteFields: bundle.websiteFields
      ? Object.fromEntries(
          Object.keys(bundle.websiteFields).map((k) => [k, next[k] ?? bundle.websiteFields![k]!]),
        )
      : undefined,
    portalFields: bundle.portalFields
      ? Object.fromEntries(
          Object.keys(bundle.portalFields).map((k) => [k, next[k] ?? bundle.portalFields![k]!]),
        )
      : undefined,
  };
}

export function enforcePublicCopyQuality(
  bundle: PublicCopyBundle,
  model: StructuredEvidenceModel,
): { bundle: PublicCopyBundle; result: CopyQualityResult; repaired: boolean; examples: string[] } {
  const first = evaluatePublicCopyQuality(bundle, model);
  if (first.ok) {
    return { bundle, result: first, repaired: false, examples: [] };
  }
  const examples = first.issues.slice(0, 8).map((i) => `${i.code}: ${i.message}`);
  let current = repairPublicCopyBundle(bundle, model, first.issues);
  let second = evaluatePublicCopyQuality(current, model);
  // Second repair pass if still failing.
  if (!second.ok) {
    current = repairPublicCopyBundle(current, model, second.issues);
    second = evaluatePublicCopyQuality(current, model);
  }
  return {
    bundle: current,
    result: second,
    repaired: true,
    examples,
  };
}
