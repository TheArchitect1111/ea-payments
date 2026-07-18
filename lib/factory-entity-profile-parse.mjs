/**
 * Pure entity-profile parse + deterministic fallback (no AI, no project store).
 * Used by factory-entity-profile.ts and node test scripts.
 */

function splitList(raw, limit = 6) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(/\s*\|\s*|\n|;/)
    .map((part) => part.replace(/^[-*•]\s*/, '').trim())
    .filter((part) => part.length > 3)
    .slice(0, limit);
}

export function blockValue(text, label, max = 700) {
  const re = new RegExp(
    `^${label}\\s*:\\s*([\\s\\S]+?)(?=\\n[A-Z][A-Z0-9_/+\\- ]{2,40}\\s*:|$)`,
    'im',
  );
  const match = String(text || '').match(re);
  const value = match?.[1]?.replace(/\s+/g, ' ').trim();
  if (!value || /^none$/i.test(value) || /^n\/?a$/i.test(value)) return undefined;
  return value.slice(0, max);
}

export function parseEntityType(raw) {
  const lower = String(raw || '').toLowerCase();
  if (/\bperson\b|individual|founder|coach|consultant/.test(lower)) return 'person';
  if (/\borg(anization)?\b|nonprofit|church|club|coalition|association/.test(lower)) {
    return 'organization';
  }
  if (/\bbusiness\b|company|brand|shop|studio/.test(lower)) return 'business';
  return 'unknown';
}

export function confidenceFromBundle(bundle) {
  let score = 0;
  if (bundle.hasPhoto && (bundle.visionSummary || bundle.whoTheyAreHint)) score += 2;
  if (bundle.hasWebsite && (bundle.websiteTextPreview?.length || 0) > 200) score += 2;
  else if (bundle.hasWebsite) score += 1;
  if (bundle.whatTheyDo || bundle.offerHint) score += 1;
  if (bundle.audience) score += 1;
  if (bundle.hasNotes) score += 0.5;
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'thin';
}

export function buildEntityProfileFallback(bundle) {
  const entityType = parseEntityType(bundle.entityTypeHint);
  const whoTheyServe = bundle.audience;
  const whatTheyOffer = bundle.offerHint || bundle.whatTheyDo;
  const whoTheyAre =
    bundle.whoTheyAreHint ||
    [
      bundle.visionSummary,
      whatTheyOffer ? `${bundle.name} offers ${whatTheyOffer.replace(/\.$/, '')}.` : null,
      whoTheyServe ? `They serve ${whoTheyServe.replace(/\.$/, '')}.` : null,
      bundle.websiteDescription,
      bundle.h1?.[0] ? `Their public story leads with “${bundle.h1[0]}”.` : null,
      bundle.goal ? `Launch goal: ${bundle.goal}.` : null,
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 700) ||
    `${bundle.name} is a ${entityType === 'unknown' ? 'organization' : entityType} we reviewed from a Factory launch signal.`;

  const evidence = [];
  if (bundle.hasPhoto && bundle.visionSummary) {
    evidence.push(`From photo: ${bundle.visionSummary.slice(0, 160)}`);
  }
  if (bundle.h1?.[0]) evidence.push(`From homepage H1: ${bundle.h1[0]}`);
  if (bundle.websiteDescription) {
    evidence.push(`From site description: ${bundle.websiteDescription.slice(0, 140)}`);
  }
  if (bundle.ctas?.[0]) evidence.push(`Visible CTA: ${bundle.ctas[0]}`);
  if (bundle.contactEmail) evidence.push(`Contact email on site: ${bundle.contactEmail}`);
  if (bundle.notes) evidence.push(`From notes: ${bundle.notes.slice(0, 120)}`);

  const frictionSignals = [
    ...(bundle.frictionHints || []),
    ...(bundle.opportunities || []),
    !bundle.ctas?.length && bundle.hasWebsite
      ? 'Primary next step is hard to spot from the public page.'
      : '',
    bundle.hasPhoto && !bundle.hasWebsite
      ? 'Public digital home is unclear from the photo alone — story needs a front door.'
      : '',
  ].filter(Boolean);

  const proofSignals = [
    ...(bundle.proofHints || []),
    (bundle.navLabels || []).some((n) => /testimonial|story|impact|about/i.test(n))
      ? 'Nav hints at story/proof pages'
      : '',
  ].filter(Boolean);

  return {
    entityType,
    name: bundle.name,
    tagline:
      bundle.h1?.[0] ||
      bundle.websiteDescription?.slice(0, 120) ||
      whatTheyOffer?.slice(0, 120) ||
      undefined,
    whoTheyAre,
    whoTheyServe,
    whatTheyOffer,
    howTheySound: bundle.voiceHint,
    proofSignals: proofSignals.slice(0, 5),
    frictionSignals: [...new Set(frictionSignals)].slice(0, 6),
    opsReality:
      bundle.opsHint ||
      (bundle.hasWebsite
        ? 'Public site suggests interest is collected online; follow-up and member ops are likely still manual or scattered.'
        : 'Without a clear digital home, intake and follow-up likely live in messages, spreadsheets, or memory.'),
    primaryAsk: bundle.cta || bundle.ctas?.[0],
    evidence: evidence.slice(0, 8),
    confidence: confidenceFromBundle(bundle),
    sourceNote: bundle.sourceNote,
  };
}

export function parseEntityProfileLabeledText(text, fallback) {
  const entityType = parseEntityType(blockValue(text, 'ENTITY_TYPE') || fallback.entityType);
  const name = blockValue(text, 'NAME', 120) || fallback.name;
  const tagline = blockValue(text, 'TAGLINE', 160) || fallback.tagline;
  const whoTheyAre = blockValue(text, 'WHO_THEY_ARE', 800) || fallback.whoTheyAre;
  const whoTheyServe = blockValue(text, 'WHO_THEY_SERVE', 280) || fallback.whoTheyServe;
  const whatTheyOffer = blockValue(text, 'WHAT_THEY_OFFER', 280) || fallback.whatTheyOffer;
  const howTheySound = blockValue(text, 'HOW_THEY_SOUND', 200) || fallback.howTheySound;
  const opsReality = blockValue(text, 'OPS_REALITY', 320) || fallback.opsReality;
  const primaryAsk = blockValue(text, 'PRIMARY_ASK', 80) || fallback.primaryAsk;
  const proofSignals = splitList(blockValue(text, 'PROOF', 400), 5);
  const frictionSignals = splitList(blockValue(text, 'FRICTION', 400), 6);
  const evidence = splitList(blockValue(text, 'EVIDENCE', 600), 8);
  const confidenceRaw = (blockValue(text, 'CONFIDENCE', 40) || '').toLowerCase();
  const confidence = confidenceRaw.includes('high')
    ? 'high'
    : confidenceRaw.includes('thin') || confidenceRaw.includes('low')
      ? 'thin'
      : confidenceRaw.includes('medium')
        ? 'medium'
        : fallback.confidence;

  return {
    entityType,
    name,
    tagline,
    whoTheyAre,
    whoTheyServe,
    whatTheyOffer,
    howTheySound,
    proofSignals: proofSignals.length ? proofSignals : fallback.proofSignals,
    frictionSignals: frictionSignals.length ? frictionSignals : fallback.frictionSignals,
    opsReality,
    primaryAsk,
    evidence: evidence.length ? evidence : fallback.evidence,
    confidence,
    sourceNote: fallback.sourceNote,
  };
}
