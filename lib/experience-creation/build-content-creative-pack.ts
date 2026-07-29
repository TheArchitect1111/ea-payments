/**
 * Content + Creative Director — knowledge pack → content_creative_pack + three premises.
 * Production requires a working creative model. Deterministic packs are fixture-only.
 */
import { runAIGateway, AIGatewayError } from '@/lib/ai/gateway';
import { getAIGatewayConfig } from '@/lib/ai/config';
import {
  containsForbiddenPublicCopy,
  findForbiddenPublicCopy,
  scrubForbiddenPublicCopy,
} from '@/lib/factory-forbidden-copy.mjs';
import { createArtifactMeta, scoreCompleteness } from '@/lib/experience-creation/meta';
import {
  assessExperienceProviderReadiness,
  isDeterministicCreativeAllowed,
} from '@/lib/experience-creation/provider-readiness';
import type {
  ContentCreativePack,
  MediaBrandPack,
  SubjectKnowledgePack,
} from '@/lib/experience-creation/types';

function evidenceBullets(knowledge: SubjectKnowledgePack): string[] {
  return knowledge.claims
    .filter((c) => c.status === 'verified' || c.status === 'supported_inference')
    .map((c) => c.text)
    .slice(0, 12);
}

function deterministicPack(
  knowledge: SubjectKnowledgePack,
  media: MediaBrandPack,
): ContentCreativePack {
  const name = knowledge.verifiedIdentity.name;
  const facts = evidenceBullets(knowledge);
  const biography = knowledge.biography || facts.slice(0, 4).join(' ');
  const positioning =
    scrubForbiddenPublicCopy(
      knowledge.organizations.length
        ? `${name} — ${knowledge.organizations.slice(0, 2).join(' and ')}`
        : facts[0],
    ) || `${name}`;
  const coreStory = biography;
  const premises: ContentCreativePack['premises'] = [
    {
      id: 'premise-cinematic',
      name: 'Cinematic Documentary',
      narrativeLens: 'Lived path and present mission in photographic chapters',
      visualMetaphor: 'Threshold between past chapter and current work',
      emotionalGoal: 'Respect, gravity, forward motion',
      heroHeadline:
        knowledge.timeline[0]
          ? `From ${knowledge.timeline[0].label} to the work that still matters`
          : `${name}: a story still being written`,
      heroSupporting: facts[0] || positioning,
      sectionSequence: ['path', 'proof', 'organizations', 'current', 'invitation'],
      whyThisFitsEvidence: 'Uses timeline and accomplishments as documentary beats.',
    },
    {
      id: 'premise-editorial',
      name: 'Editorial Journal',
      narrativeLens: 'Publication profile of expertise and initiatives',
      visualMetaphor: 'Annotated chapters of evidence',
      emotionalGoal: 'Clarity, authority, curiosity',
      heroHeadline:
        knowledge.professionalRoles.length >= 2
          ? `${name}: ${knowledge.professionalRoles.slice(0, 3).join(', ').toLowerCase()}`
          : `A profile of ${name}`,
      heroSupporting: facts[1] || facts[0] || positioning,
      sectionSequence: ['profile', 'expertise', 'initiatives', 'media', 'invitation'],
      whyThisFitsEvidence: 'Organizes roles, organizations, and citations like a journal.',
    },
    {
      id: 'premise-intimate',
      name: 'Intimate Studio',
      narrativeLens: 'Direct introduction and relationship-first invitation',
      visualMetaphor: 'Quiet studio conversation',
      emotionalGoal: 'Trust, proximity, honesty',
      heroHeadline: `Meet ${name}`,
      heroSupporting: knowledge.currentWork[0] || facts[0] || positioning,
      sectionSequence: ['introduction', 'beliefs', 'work', 'audience', 'invitation'],
      whyThisFitsEvidence: 'Centers current work and audience without dashboard chrome.',
    },
  ];

  // Scrub premises
  for (const premise of premises) {
    premise.heroHeadline = scrubForbiddenPublicCopy(premise.heroHeadline) || name;
    premise.heroSupporting = scrubForbiddenPublicCopy(premise.heroSupporting) || positioning;
  }

  const claimToSourceMap = knowledge.claims.slice(0, 20).map((c) => ({
    claim: c.text,
    sourceUrls: c.sourceUrls,
  }));

  const completeness = scoreCompleteness([
    biography.length >= 80,
    facts.length >= 3,
    premises.every((p) => p.heroHeadline !== premises[0]!.heroHeadline || p.id === 'premise-cinematic'),
    !containsForbiddenPublicCopy(coreStory),
  ]);

  const pack: ContentCreativePack = {
    ...createArtifactMeta({
      projectId: knowledge.projectId,
      subjectIdentity: name,
      providerId: 'experience-creation-content',
      inputArtifactIds: [...knowledge.inputArtifactIds, ...media.inputArtifactIds],
      provenanceNotes: 'Evidence-backed content package (deterministic path)',
      confidence: 0.65,
      completeness,
    }),
    kind: 'content_creative_pack',
    coreStory,
    centralTension:
      knowledge.currentWork[0] && knowledge.accomplishments[0]
        ? 'Connecting proven chapters of the past to the work happening now.'
        : 'Making a clear public story from verified evidence without filler.',
    positioning,
    audience: knowledge.audiences[0] || 'People seeking a clear next step',
    desiredEmotionalResponse: 'Respect and readiness to continue',
    brandPersonality: 'Grounded, precise, human',
    premises,
    biography,
    timelineNarrative: knowledge.timeline.map((t) => `${t.label}: ${t.detail}`).join(' ') || biography,
    accomplishmentNarratives: knowledge.accomplishments.slice(0, 6),
    currentWorkNarrative: knowledge.currentWork.join(' ') || facts[1] || biography,
    organizationDescriptions: knowledge.organizations.map((org) => `${org} — part of ${name}’s public work.`),
    sectionHeadlines: [
      'The path so far',
      'What the work stands for',
      'Organizations and chapters',
      'Where the work goes next',
    ],
    sectionBodies: [
      knowledge.timeline[0]?.detail || facts[0] || biography,
      facts[1] || coreStory,
      knowledge.organizations.join(' · ') || facts[2] || positioning,
      knowledge.currentWork[0] || 'One clear next conversation.',
    ],
    quotes: knowledge.quotes.map((q) => q.text),
    callsToAction: knowledge.callsToAction,
    websiteJourney: ['Arrive at the human story', 'See proof', 'Understand current work', 'Continue into the portal'],
    portalPurpose: 'A calm place to continue the relationship after the public story.',
    websiteToPortalTransition: 'The public invitation becomes one next-best action inside the portal.',
    visualThesis: media.intentionalTypographyLed
      ? 'Typography-led documentary until approved media arrives.'
      : 'Image-led documentary with editorial restraint.',
    typographyDirection: media.typographyClues[0] || 'Expressive editorial display with readable sans body',
    colorLogic: `Primary ${media.colors[0]}; accent ${media.colors[1] || media.colors[0]}`,
    photographyDirection: media.intentionalTypographyLed
      ? 'No fabricated likeness; temporary absence of photography is intentional.'
      : 'Prefer documentary portraits and environment stills marked preview-only.',
    motionDirection: 'Slow scene reveals tied to narrative progression',
    prohibitedPatterns: [
      'Generic mission slogans',
      'Fake statistics',
      'Repeated clarification text as finished sections',
      'Internal Factory language',
      'Unpublished /sites CTAs',
    ],
    claimToSourceMap,
  };

  // Diversify section bodies so clarification is not stamped into every block.
  pack.sectionBodies = [
    knowledge.timeline[0]?.detail || facts[0] || biography,
    facts[1] || knowledge.accomplishments[0] || coreStory,
    knowledge.organizations.join(' · ') || facts[2] || positioning,
    knowledge.currentWork[0] || facts[3] || 'One clear next conversation.',
  ].map((body) => scrubForbiddenPublicCopy(body) || body);

  const leak = findForbiddenPublicCopy(pack);
  pack.validation = {
    ok: leak.ok && biography.length >= 40,
    reasons: leak.ok ? [] : [`Forbidden copy: ${leak.matches[0]}`],
  };
  return pack;
}

export async function buildContentCreativePack(
  knowledge: SubjectKnowledgePack,
  media: MediaBrandPack,
  options?: { allowDeterministicFixture?: boolean },
): Promise<ContentCreativePack> {
  const config = getAIGatewayConfig();
  const readiness = assessExperienceProviderReadiness({
    allowDeterministicFixture: options?.allowDeterministicFixture,
  });

  if (!config.apiKey) {
    if (isDeterministicCreativeAllowed(options)) {
      const pack = deterministicPack(knowledge, media);
      pack.warnings.push('FIXTURE_ONLY: deterministic creative pack (tests).');
      pack.provider = { id: 'experience-creation-content-fixture', notes: 'FIXTURE_ONLY' };
      return pack;
    }
    const blocked = deterministicPack(knowledge, media);
    blocked.warnings.push(
      'BLOCKED_PROVIDER: creative model unavailable. Deterministic output is not finished work.',
    );
    blocked.provider = {
      id: 'experience-creation-content',
      notes: 'BLOCKED_PROVIDER',
    };
    blocked.provenanceNotes = `BLOCKED_PROVIDER — ${readiness.configurationHints[0] || 'configure OPENAI_API_KEY'}`;
    blocked.validation = {
      ok: false,
      reasons: [
        'BLOCKED_PROVIDER: creative model credentials missing — cannot certify content_creative_pack.',
        ...readiness.reasons.filter((r) => /Creative|OPENAI/i.test(r)).slice(0, 2),
      ],
    };
    blocked.confidence = 0;
    return blocked;
  }

  try {
    const response = await runAIGateway(
      {
        system: [
          'You are the EA Creative Director for premium website and portal experiences.',
          'Use only the supplied verified evidence. Never invent biography, stats, or testimonials.',
          'Never use slogans like "exists to help the people it serves" or internal instructions.',
          'Return JSON with keys: coreStory, positioning, audience, biography, premises (array of 3 with name, narrativeLens, visualMetaphor, emotionalGoal, heroHeadline, heroSupporting, sectionSequence, whyThisFitsEvidence), sectionHeadlines, sectionBodies, portalPurpose, visualThesis.',
          'The three premises must differ structurally and narratively.',
        ].join(' '),
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              subject: knowledge.verifiedIdentity,
              biography: knowledge.biography,
              claims: knowledge.claims.slice(0, 16),
              organizations: knowledge.organizations,
              currentWork: knowledge.currentWork,
              timeline: knowledge.timeline,
              mediaSummary: {
                assetCount: media.assets.length,
                typographyLed: media.intentionalTypographyLed,
                colors: media.colors,
              },
            }),
          },
        ],
        responseFormat: 'json',
        temperature: 0.4,
        maxOutputTokens: 2500,
        promptVersion: 'ea-experience-creation-content-v1',
        metadata: { projectId: knowledge.projectId },
      },
      {
        requestId: `ece-content-${knowledge.projectId}`,
        actor: { type: 'admin', id: 'experience-creation-engine' },
        route: 'experience-creation/content',
      },
    );

    const parsed = JSON.parse(response.text) as Partial<ContentCreativePack> & {
      premises?: ContentCreativePack['premises'];
    };
    const base = deterministicPack(knowledge, media);
    const merged: ContentCreativePack = {
      ...base,
      ...createArtifactMeta({
        projectId: knowledge.projectId,
        subjectIdentity: knowledge.verifiedIdentity.name,
        providerId: 'experience-creation-content',
        model: response.model,
        inputArtifactIds: base.inputArtifactIds,
        provenanceNotes: 'AI Creative Director over verified knowledge pack',
        confidence: 0.8,
        completeness: base.completeness,
      }),
      kind: 'content_creative_pack',
      coreStory: scrubForbiddenPublicCopy(parsed.coreStory) || base.coreStory,
      positioning: scrubForbiddenPublicCopy(parsed.positioning) || base.positioning,
      audience: scrubForbiddenPublicCopy(parsed.audience) || base.audience,
      biography: scrubForbiddenPublicCopy(parsed.biography) || base.biography,
      premises:
        Array.isArray(parsed.premises) && parsed.premises.length === 3
          ? parsed.premises.map((p, i) => ({
              ...base.premises[i]!,
              ...p,
              heroHeadline: scrubForbiddenPublicCopy(p.heroHeadline) || base.premises[i]!.heroHeadline,
              heroSupporting:
                scrubForbiddenPublicCopy(p.heroSupporting) || base.premises[i]!.heroSupporting,
            }))
          : base.premises,
      sectionHeadlines: Array.isArray(parsed.sectionHeadlines)
        ? parsed.sectionHeadlines.map((h) => scrubForbiddenPublicCopy(h) || h).filter(Boolean)
        : base.sectionHeadlines,
      sectionBodies: Array.isArray(parsed.sectionBodies)
        ? parsed.sectionBodies.map((b) => scrubForbiddenPublicCopy(b) || '').filter(Boolean)
        : base.sectionBodies,
      portalPurpose: scrubForbiddenPublicCopy(parsed.portalPurpose) || base.portalPurpose,
      visualThesis: scrubForbiddenPublicCopy(parsed.visualThesis) || base.visualThesis,
      provider: {
        id: 'experience-creation-content',
        model: response.model,
        notes: 'AI-assisted',
      },
    };

    const leak = findForbiddenPublicCopy(merged);
    const headlines = new Set(merged.premises.map((p) => p.heroHeadline.toLowerCase()));
    merged.validation = {
      ok: leak.ok && headlines.size >= 3 && merged.biography.length >= 40,
      reasons: [
        ...(leak.ok ? [] : [`Forbidden copy: ${leak.matches[0]}`]),
        ...(headlines.size >= 3 ? [] : ['Premises must have distinct headlines']),
      ],
    };
    return merged;
  } catch (err) {
    if (isDeterministicCreativeAllowed(options)) {
      const base = deterministicPack(knowledge, media);
      base.warnings.push('FIXTURE_ONLY fallback after AI error.');
      return base;
    }
    const blocked = deterministicPack(knowledge, media);
    const msg =
      err instanceof AIGatewayError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'unknown error';
    blocked.warnings.push(`BLOCKED_PROVIDER: creative path failed (${msg}).`);
    blocked.provider = { id: 'experience-creation-content', notes: 'BLOCKED_PROVIDER' };
    blocked.validation = {
      ok: false,
      reasons: [
        'BLOCKED_PROVIDER: creative model call failed — deterministic pack is not finished work.',
      ],
    };
    blocked.confidence = 0;
    return blocked;
  }
}
