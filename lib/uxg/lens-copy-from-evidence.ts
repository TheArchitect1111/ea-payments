/**
 * Build lens-scoped public copy from a structured evidence model.
 * Fact-once: each claim text is assigned to at most one public field.
 */
import { scrubForbiddenPublicCopy } from '@/lib/factory-forbidden-copy.mjs';
import type { ContentPackageLensCopy } from '@/lib/factory-content-package';
import type { StructuredEvidenceModel } from '@/lib/uxg/evidence-model';

function takeUnused(
  used: Set<string>,
  candidates: Array<string | undefined>,
  fallback: string,
): string {
  for (const raw of candidates) {
    const cleaned = scrubForbiddenPublicCopy(raw);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase().replace(/\s+/g, ' ').trim();
    if (used.has(key)) continue;
    used.add(key);
    return cleaned;
  }
  const fb = scrubForbiddenPublicCopy(fallback) || fallback;
  const fbKey = fb.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!used.has(fbKey)) used.add(fbKey);
  return fb;
}

function claimTexts(
  model: StructuredEvidenceModel,
  scope: 'subject' | 'organization' | 'educational' | 'cta',
): string[] {
  return model.allClaims.filter((c) => c.scope === scope).map((c) => c.text);
}

export function buildLensCopyFromEvidence(
  model: StructuredEvidenceModel,
  lens: 'cinematic' | 'editorial' | 'intimate',
): ContentPackageLensCopy {
  const used = new Set<string>();
  const subject = model.subjectIdentity;
  const role = model.verifiedRole;
  const org = model.verifiedOrganization;
  const subjectFacts = claimTexts(model, 'subject');
  const orgFacts = claimTexts(model, 'organization');
  const eduFacts = claimTexts(model, 'educational');
  const services = model.organizationServices.map((c) => c.text);
  const history = model.history.map((c) => c.text);
  const geo = model.geography.map((c) => c.text);

  const aboutBody = takeUnused(
    used,
    [
      subjectFacts.find((t) => t.length > 24 && !services.some((s) => t.includes(s.slice(0, 12)))),
      role && org ? `${subject} serves as ${role} with ${org}.` : undefined,
      role ? `${subject} serves as ${role}.` : undefined,
      subjectFacts[0],
    ],
    `${subject} helps people take a clear next step.`,
  );

  const pathwayBody = takeUnused(
    used,
    [
      services[0],
      orgFacts.find((t) => /service|program|product|offer|care|ministry|collection/i.test(t)),
      orgFacts[0],
    ],
    org
      ? `${org} provides coordinated support for the people it serves.`
      : 'Organization pathways are drawn from verified evidence.',
  );

  const journeyBody = takeUnused(
    used,
    [eduFacts[0], history[0], subjectFacts[1], subjectFacts[2]],
    'Expect a clear introduction, then a practical next conversation.',
  );

  const geoBody = takeUnused(
    used,
    [geo[0], history.find((t) => /since|founded|county|region|serves/i.test(t)), orgFacts[1]],
    org
      ? `${org} maintains a clear local presence for the people it serves.`
      : 'Geography follows verified organization signals.',
  );

  const orgCapabilityLine = takeUnused(
    used,
    [org, services[1], orgFacts.find((t) => t !== pathwayBody)],
    org ? `${org}` : 'Trusted organizational partners',
  );

  const heroSupporting = takeUnused(
    used,
    [
      lens === 'cinematic' && role && org
        ? `Serving as ${role} with ${org}.`
        : undefined,
      lens === 'editorial' && role
        ? `${role}${org ? ` · ${org}` : ''}`
        : undefined,
      lens === 'intimate' && org
        ? `A direct introduction to work with ${org}.`
        : undefined,
      role && org ? `Serving as ${role} with ${org}.` : undefined,
      role ? `Serving as ${role}.` : undefined,
      subjectFacts.find((t) => t !== aboutBody),
    ],
    lens === 'editorial'
      ? `Selected public chapters for ${subject}.`
      : lens === 'intimate'
        ? `Meet ${subject} with a clear next conversation.`
        : `A public introduction to ${subject}.`,
  );

  const audienceLine = takeUnused(
    used,
    [eduFacts.find((t) => /audience|families|patients|members|customers|community|people/i.test(t))],
    'People who want a clear next step with someone they can trust',
  );

  const nextStep = takeUnused(
    used,
    ['Start with one clear next conversation.'],
    'Start with one clear next conversation.',
  );

  const portalPurpose =
    `Private tools, progress, messages, and documents that continue the relationship with ${subject} — not a restatement of the public page.`;

  if (lens === 'editorial') {
    return {
      heroHeadline:
        role && org
          ? `${role} · ${org}`
          : role
            ? `${role}`
            : `A profile of ${subject}`,
      heroSupporting,
      aboutTitle: 'Selected chapters',
      aboutBody,
      sectionHeadlines: [
        'Expertise in context',
        'Organization capabilities',
        'Evidence and milestones',
        'Current work',
      ],
      sectionBodies: [
        takeUnused(used, [subjectFacts[1], journeyBody], journeyBody),
        orgCapabilityLine,
        takeUnused(used, [history[0], history[1], services[2]], geoBody),
        pathwayBody,
      ],
      ctaLabel: 'Start a conversation',
      portalPurpose,
    };
  }

  if (lens === 'intimate') {
    return {
      heroHeadline: role ? `${subject}, ${role}` : `Meet ${subject}`,
      heroSupporting,
      aboutTitle: 'A direct introduction',
      aboutBody,
      sectionHeadlines: ['What matters', 'How the work continues', 'Who this is for', 'Begin together'],
      sectionBodies: [journeyBody, pathwayBody, audienceLine, nextStep],
      ctaLabel: 'Begin a conversation',
      portalPurpose,
    };
  }

  return {
    heroHeadline: org ? `${subject} · ${org}` : role ? `${subject} — ${role}` : `Guided next steps with ${subject}`,
    heroSupporting,
    aboutTitle: `Who ${subject} is`,
    aboutBody,
    sectionHeadlines: [
      'The path so far',
      'What the organization provides',
      'Where the work lives',
      'Where the story goes next',
    ],
    sectionBodies: [journeyBody, pathwayBody, geoBody, nextStep],
    ctaLabel: 'Start a conversation',
    portalPurpose,
  };
}
