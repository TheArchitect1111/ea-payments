/**
 * Subject-evidence relevance + draft-ready quality for UXG.
 * Prefer honest role/org-backed drafts over a fixed personal-fact quota.
 */

const CONFUSED_NEAR_NAMES: Record<string, string[]> = {
  brickey: ['behringer', 'burkey', 'brickley', 'brickeys'],
};

export function subjectNameTokens(subjectName: string): { first: string; last: string; full: string } {
  const parts = subjectName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return {
    first: parts[0] || '',
    last: parts[parts.length - 1] || '',
    full: parts.join(' '),
  };
}

/**
 * Reject evidence that clearly belongs to a different person/org with a similar name.
 */
export function isEvidenceRelevantToSubject(
  subjectName: string,
  text: string,
  sourceUrl?: string,
): boolean {
  const hay = `${text || ''} ${sourceUrl || ''}`.toLowerCase();
  if (!hay.trim()) return false;
  const { first, last, full } = subjectNameTokens(subjectName);
  if (!last) return true;

  const confused = CONFUSED_NEAR_NAMES[last] || [];
  for (const wrong of confused) {
    if (hay.includes(wrong) && !hay.includes(last)) return false;
    // Near-name collisions — same first name, wrong surname
    if (first && hay.includes(`${first} ${wrong}`)) return false;
  }

  // Encyclopedia / wiki bio pages for a different surname
  if (
    /wikipedia\.org|britannica\.com|encyclopedia/i.test(hay) &&
    last &&
    !hay.includes(last) &&
    /biography|born\s+\d{4}|early life/i.test(hay)
  ) {
    return false;
  }

  // Another "First Last" where Last differs from subject last and First matches
  if (first && last) {
    const otherPerson = new RegExp(
      `\\b${escapeReg(first)}\\s+([A-Z][a-z]{2,}|[a-z]{3,})\\b`,
      'i',
    );
    const match = hay.match(otherPerson);
    if (match?.[1]) {
      const otherLast = match[1].toLowerCase();
      if (otherLast !== last && !full.includes(otherLast) && otherLast.length > 2) {
        // Allow org names / common words
        if (!/clinical|liaison|hospital|health|home|care|north|carolina|home\s*health/i.test(otherLast)) {
          if (confused.includes(otherLast) || (otherLast !== last && hay.includes(`${first} ${otherLast}`) && !hay.includes(last))) {
            return false;
          }
        }
      }
    }
  }

  return true;
}

function escapeReg(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type EvidenceQualityInput = {
  subjectName: string;
  identityStatus?: 'resolved' | 'ambiguous' | 'incomplete' | 'search_failed' | string;
  claims: Array<{ text: string; status?: string; sourceUrl?: string; sourceUrls?: string[] }>;
  organizations?: string[];
  professionalRoles?: string[];
  currentWork?: string[];
  biography?: string;
  sources?: Array<{ url?: string }>;
  officialWebsite?: string | null;
};

export type EvidenceQualityResult = {
  ok: boolean;
  reasons: string[];
  mode: 'role_org_draft' | 'rich_personal' | 'blocked';
};

/**
 * Draft-ready when identity is usable and we have role/employer/org/mission evidence.
 * Does NOT require three personal facts.
 */
export function evaluateEvidenceQuality(input: EvidenceQualityInput): EvidenceQualityResult {
  const reasons: string[] = [];
  const status = (input.identityStatus || '').toLowerCase();

  if (status === 'ambiguous') {
    return {
      ok: false,
      mode: 'blocked',
      reasons: ['Identity remains ambiguous — clarification required before drafting.'],
    };
  }
  if (status === 'search_failed') {
    return {
      ok: false,
      mode: 'blocked',
      reasons: ['Subject identity could not be confirmed from public sources.'],
    };
  }

  const relevantClaims = input.claims.filter((c) =>
    isEvidenceRelevantToSubject(
      input.subjectName,
      c.text,
      c.sourceUrl || c.sourceUrls?.[0],
    ),
  );
  const verifiedLike = relevantClaims.filter((c) =>
    /verified|inferred|admin_clarification|supported_inference/i.test(c.status || 'verified'),
  );

  const hasRole =
    (input.professionalRoles || []).some(Boolean) ||
    verifiedLike.some((c) =>
      /liaison|nurse|director|founder|physician|therapist|manager|coordinator|clinician|role|title/i.test(
        c.text,
      ),
    );
  const hasOrg =
    (input.organizations || []).some(Boolean) ||
    verifiedLike.some((c) =>
      /\b(inc|llc|hospital|health|clinic|home\s*health|3hc|organization|employer)\b/i.test(c.text),
    );
  const hasOfficial =
    Boolean(input.officialWebsite) ||
    (input.sources || []).some((s) => /^https?:\/\//i.test(s.url || '')) ||
    verifiedLike.some((c) => (c.sourceUrl || c.sourceUrls?.[0] || '').startsWith('http'));
  const hasClarification = verifiedLike.some((c) =>
    /admin_clarification|supported_inference/i.test(c.status || ''),
  );
  const hasMissionOrAudience = verifiedLike.some((c) =>
    /patient|family|community|care|service|mission|audience|home health/i.test(c.text),
  );
  const bioOk = (input.biography || '').trim().length >= 24 || verifiedLike.length >= 1;

  const canDraft =
    (hasRole && (hasOrg || hasOfficial || hasClarification)) ||
    (hasOrg && (hasOfficial || hasClarification || hasMissionOrAudience)) ||
    (hasClarification && verifiedLike.length >= 1 && bioOk);

  if (!canDraft) {
    if (!verifiedLike.length) {
      reasons.push('No subject-relevant verified evidence available for an honest draft.');
    } else {
      reasons.push(
        'Evidence cannot yet support an honest draft — need a confirmed role/employer or official organization source.',
      );
    }
    return { ok: false, mode: 'blocked', reasons };
  }

  const rich =
    verifiedLike.length >= 5 &&
    (input.biography || '').length >= 80 &&
    (hasRole || hasOrg);

  return {
    ok: true,
    mode: rich ? 'rich_personal' : 'role_org_draft',
    reasons: rich
      ? []
      : [
          'Limited personal biography — drafting from verified role, organization, and public mission signals.',
        ],
  };
}
