/**
 * Pure Opportunity Intelligence Brief™ parse + deterministic fallback (no AI).
 */

function splitList(raw, limit = 10) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(/\s*\|\s*|\n/)
    .map((part) => part.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter((part) => part.length > 4)
    .slice(0, limit);
}

export function blockValue(text, label, max = 900) {
  const re = new RegExp(
    `^${label}\\s*:\\s*([\\s\\S]+?)(?=\\n[A-Z][A-Z0-9_/+\\- ]{2,40}\\s*:|$)`,
    'im',
  );
  const match = String(text || '').match(re);
  const value = match?.[1]?.replace(/\s+/g, ' ').trim();
  if (!value || /^none$/i.test(value) || /^n\/?a$/i.test(value)) return undefined;
  return value.slice(0, max);
}

export function parseHexColor(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  const match = raw.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (!match) return fallback;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex.toLowerCase()}`;
}

export function premiumPaletteForName(name) {
  const palettes = [
    { primary: '#0f2c4c', accent: '#c4a35a' },
    { primary: '#1a3a2a', accent: '#d4a017' },
    { primary: '#2c1e3e', accent: '#e8b4a0' },
    { primary: '#1e2a3a', accent: '#5b9bd5' },
    { primary: '#3b1f1f', accent: '#d97757' },
    { primary: '#0d3b4c', accent: '#7ec8c3' },
    { primary: '#1b2b4d', accent: '#c9a844' },
  ];
  const key = String(name || 'org')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palettes[key % palettes.length];
}

export function industryFamilyFromText(blob) {
  const t = String(blob || '').toLowerCase();
  if (/\b(youth|club|nonprofit|church|coalition|foundation|donor|volunteer|mission)\b/.test(t)) {
    return 'nonprofit';
  }
  if (/\b(sport|team|athlete|player|coach|league|recruit)\b/.test(t)) return 'sports';
  if (/\b(clinic|patient|medical|health|hospital|care)\b/.test(t)) return 'medical';
  if (/\b(school|student|university|campus|classroom|teacher)\b/.test(t)) return 'education';
  if (/\b(church|ministry|congregation|faith)\b/.test(t)) return 'faith';
  return 'business';
}

export function portalModulesForFamily(family) {
  switch (family) {
    case 'nonprofit':
      return ['Donors', 'Volunteers', 'Programs', 'Events', 'Communication', 'Impact', 'Reporting', 'Tasks'];
    case 'sports':
      return ['Players', 'Families', 'Schedules', 'Payments', 'Messages', 'Recruiting', 'Development'];
    case 'medical':
      return ['Patients', 'Appointments', 'Compliance', 'Documents', 'Staff', 'Messages'];
    case 'education':
      return ['Students', 'Families', 'Classes', 'Schedule', 'Resources', 'Messages', 'Staff'];
    case 'faith':
      return ['Members', 'Groups', 'Events', 'Giving', 'Messages', 'Volunteers', 'Care'];
    default:
      return ['Clients', 'Pipeline', 'Projects', 'Schedule', 'Documents', 'Billing', 'Messages'];
  }
}

export function memberPersonaForFamily(family) {
  switch (family) {
    case 'nonprofit':
      return 'Volunteer';
    case 'sports':
      return 'Family';
    case 'medical':
      return 'Patient';
    case 'education':
      return 'Student';
    case 'faith':
      return 'Member';
    default:
      return 'Client';
  }
}

export function memberTilesForPersona(persona) {
  const base = ['Messages', 'Upcoming Events', 'Resources', 'Tasks', 'Progress', 'Announcements'];
  if (/donor|supporter/i.test(persona)) return ['Impact', 'Giving', 'Events', 'Messages', 'Resources'];
  if (/player|athlete/i.test(persona)) return ['Schedule', 'Development', 'Messages', 'Team', 'Resources'];
  if (/patient/i.test(persona)) return ['Appointments', 'Documents', 'Messages', 'Care plan', 'Resources'];
  return base;
}

function parseObjections(raw) {
  const parts = splitList(raw, 6);
  const out = [];
  for (const part of parts) {
    const split = part.split(/\s*→\s*|\s*->\s*|\s*—\s*Response:\s*/i);
    if (split.length >= 2) {
      out.push({
        objection: split[0].replace(/^["']|["']$/g, '').trim(),
        response: split.slice(1).join(' ').trim(),
      });
    }
  }
  return out.slice(0, 3);
}

function parseHiddenOpps(raw) {
  const parts = splitList(raw, 5);
  return parts.map((part) => {
    const bits = part.split(/\s*\/\s*|\s*;\s*/);
    if (bits.length >= 3) {
      return {
        observation: bits[0].trim(),
        businessImpact: bits[1].trim(),
        possibleFuture: bits[2].trim(),
      };
    }
    return {
      observation: part,
      businessImpact: 'Capacity and engagement leak when this stays unresolved.',
      possibleFuture: 'A clearer guided system turns this gap into a strength.',
    };
  });
}

function scoreFromOverall(overall, offset) {
  return Math.max(28, Math.min(92, Math.round(overall + offset)));
}

function scorecardFromOverall(overall, confidence) {
  const thin = confidence === 'thin';
  return [
    { key: 'missionClarity', label: 'Mission Clarity', score: scoreFromOverall(overall, 4), note: 'How quickly a stranger understands why you exist.' },
    { key: 'firstImpression', label: 'First Impression', score: scoreFromOverall(overall, -2), note: 'What the first screen communicates on a phone.' },
    { key: 'trust', label: 'Trust', score: scoreFromOverall(overall, -4), note: 'Proof near the ask — people, outcomes, credibility.' },
    { key: 'callsToAction', label: 'Calls to Action', score: scoreFromOverall(overall, -6), note: 'Is the next step obvious and calm?' },
    { key: 'websiteExperience', label: 'Website Experience', score: scoreFromOverall(overall, 0), note: 'Story, clarity, and journey on the public site.' },
    { key: 'mobileExperience', label: 'Mobile Experience', score: scoreFromOverall(overall, -3), note: 'How the experience feels on a phone.' },
    { key: 'searchVisibility', label: 'Search Visibility', score: thin ? 40 : scoreFromOverall(overall, -8), note: thin ? 'Limited signal — treat as directional.' : 'How findable the public story appears.' },
    { key: 'socialPresence', label: 'Social Presence', score: thin ? 38 : scoreFromOverall(overall, -5), note: thin ? 'Limited signal — treat as directional.' : 'Awareness vs action from social channels.' },
    { key: 'brandConsistency', label: 'Brand Consistency', score: scoreFromOverall(overall, 2), note: 'Look, language, and promise staying aligned.' },
    { key: 'communityEngagement', label: 'Community Engagement', score: scoreFromOverall(overall, -1), note: 'Belonging after someone says yes.' },
    { key: 'memberJourney', label: 'Member Journey', score: scoreFromOverall(overall, -7), note: 'Guided path from interest to ongoing participation.' },
    { key: 'operationalReadiness', label: 'Operational Readiness', score: scoreFromOverall(overall, -5), note: 'Whether leadership can run the day from one place.' },
    { key: 'communication', label: 'Communication', score: scoreFromOverall(overall, -3), note: 'Messages, updates, and follow-up without chasing tools.' },
    { key: 'digitalExperience', label: 'Digital Experience', score: overall, note: 'Overall maturity of the public + ops + member system.' },
  ];
}

/**
 * Build Opportunity Intelligence Brief™ fallback from research + profile.
 */
export function buildOpportunityBriefFallback(input) {
  const profile = input.profile || {};
  const research = input.research || {};
  const name = research.name || profile.name || 'this organization';
  const family =
    research.industryFamily ||
    industryFamilyFromText(
      [input.industryHint, research.industry, profile.whoTheyServe, profile.whatTheyOffer, profile.whoTheyAre, name].join(
        ' ',
      ),
    );
  const palette = premiumPaletteForName(name);
  const primary = parseHexColor(research.brand?.primary || input.primaryColor, palette.primary);
  const accent = parseHexColor(research.brand?.accent || input.accentColor, palette.accent);
  const audience = research.primaryAudience || profile.whoTheyServe || 'the people you serve';
  const offer = research.offer || profile.whatTheyOffer || 'your programs and relationships';
  const story = research.story || `We help ${audience}.`;
  const persona = research.memberPersona || memberPersonaForFamily(family);
  const modules = research.portalModules?.length ? research.portalModules : portalModulesForFamily(family);
  const tiles = research.memberTiles?.length ? research.memberTiles : memberTilesForPersona(persona);
  const friction = (profile.frictionSignals || research.frictionHints || []).slice(0, 5);
  const confidence = research.confidence || profile.confidence || 'medium';

  const whatWeLearned =
    friction.length >= 3
      ? friction.map((f) => (f.endsWith('.') ? f : `${f}.`))
      : [
          ...friction.map((f) => (f.endsWith('.') ? f : `${f}.`)),
          `Their mission appears stronger than their digital presence communicates.`,
          `Visitors may struggle to understand what to do next on the public site.`,
          `Day-to-day work may still rely on disconnected tools and inboxes.`,
          `Impact deserves to sit closer to the registration or contribution ask.`,
        ].slice(0, 5);

  const hiddenOpportunities = (friction.length ? friction : whatWeLearned).slice(0, 4).map((obs) => ({
    observation: obs.replace(/\.$/, ''),
    businessImpact: 'Interest and staff hours leak when this gap stays informal.',
    possibleFuture: `A guided public story + ops home + ${persona.toLowerCase()} experience makes this a strength.`,
  }));

  const readiness =
    typeof input.scorecard?.overallScore === 'number' ? input.scorecard.overallScore : research.digitalMaturity || 50;
  const starting =
    readiness < 55 ? 'Future Website' : readiness < 70 ? 'Executive Operations Portal' : 'Member Experience';

  const evidence = (research.evidence || []).slice(0, 6);
  if (!evidence.length) {
    if (research.hasPhoto) evidence.push({ label: 'Launch photo', detail: 'Visual signal from phone Launch capture.' });
    if (research.websiteTitle) evidence.push({ label: 'Homepage title', detail: research.websiteTitle });
    if (research.h1?.[0]) evidence.push({ label: 'Homepage H1', detail: research.h1[0] });
  }

  return {
    productName: 'Opportunity Intelligence Brief™',
    organization: name,
    industry: research.industry || input.industryHint || family,
    industryFamily: family,
    primaryAudience: audience,
    story,
    digitalMaturity: readiness,
    estimatedOpportunity: input.opportunityLabel || '—',
    overallConfidence: confidence,
    recommendedStartingPoint: starting,
    generationTime: input.generationTime || 'a few minutes',
    preparedForConsultant: input.consultantName || 'Robert',
    preparedDate: input.preparedDate || new Date().toISOString().slice(0, 10),
    estimatedReviewTime: '3 minutes',
    whoTheyAre:
      profile.whoTheyAre ||
      research.whoTheyAre ||
      `${name} exists to serve ${audience}. Their work centers on ${offer}. Publicly, the opportunity is to make that clarity unmistakable — so the quality of the work shows up in the digital experience.`,
    whatWeLearned,
    hiddenOpportunities,
    evidence,
    scorecard: scorecardFromOverall(readiness, confidence),
    website: {
      purpose: `Show how someone falls in love with ${name} — who they help, why it matters, what to do next.`,
      talkingPoint: `Ask: “Does this feel like ${name} within the first few seconds?”`,
      businessValue: 'Clarity at the front door raises qualified interest and reduces bounce.',
    },
    portal: {
      purpose: `Show leadership how ${name} becomes easier to run day to day.`,
      talkingPoint: 'Ask: “What if your team started every morning here?”',
      businessValue: 'One ops home cuts missed follow-up and recovers staff hours.',
      modules,
    },
    member: {
      persona,
      purpose: `Show how every ${persona.toLowerCase()} experiences belonging with ${name}.`,
      talkingPoint: `Ask: “Imagine every ${persona.toLowerCase()} having a space like this.”`,
      businessValue: 'Belonging after “yes” improves engagement and reduces support load.',
      tiles,
    },
    conversationStarters: [
      `I noticed the public story could be clearer in the first few seconds — how do people usually discover ${name} today?`,
      'Where does interest tend to stall after someone shows up — registration, follow-up, or belonging?',
      'What takes the most staff time each week that should not require heroics?',
      `If ${audience} felt guided after saying yes, what would change for your team?`,
      'Which part of the work are you most proud of — and where does that get lost online?',
    ],
    discoveryQuestions: [
      `How do people normally discover ${name}?`,
      'How do new people register or get involved today?',
      'What takes the most staff time each week?',
      'What do people frequently call or message you about?',
      'Which systems do you open every morning to run the day?',
      'Where does communication break down between leadership and participants?',
      'What would you eliminate tomorrow if you could?',
      'What does success look like twelve months from now?',
      'Who on your team owns the digital experience today?',
      'What would make this conversation a win for you?',
    ],
    objections: [
      {
        objection: 'We already have a website.',
        response:
          "I agree — and this is not about replacing it for its own sake. It is about whether the people you serve can fall in love with the organization in the first few seconds, then know exactly what to do next.",
      },
      {
        objection: "We don't have budget for a big rebuild.",
        response:
          'Understood. That is why we start with an Opportunity Intelligence Brief™ — so you can see the direction and prioritize the one surface that unlocks the most capacity first.',
      },
      {
        objection: 'Our team is already busy.',
        response:
          'Exactly why this matters. The goal is fewer tools and less chasing — so your team spends time on the mission, not on coordination.',
      },
    ],
    meetingStrategy: {
      showFirst: starting,
      discussFirst: whatWeLearned[0] || `Mission clarity for ${name}`,
      mostCompelling: hiddenOpportunities[0]?.observation || starting,
      flow20: [
        `Open with ${starting}.`,
        'Share one observation from What We Learned.',
        'Show the Member Experience for emotional connection.',
        'Ask which future feels most urgent.',
      ],
      flow45: [
        'Open with Who They Are — reflect their mission back.',
        `Show ${starting} first.`,
        'Walk Hidden Opportunities with evidence callouts.',
        'Show the remaining two concepts.',
        'Run 3 discovery questions.',
        'Close on next steps and priorities — not software.',
      ],
    },
    nextSteps: {
      immediate: 'Send a short thank-you and the three concept images they responded to most.',
      withinOneWeek: 'Confirm priorities from the meeting and draft a Skin Brief for the winning surface.',
      withinThirtyDays: 'Approve scope for the first build surface and line up content/brand assets.',
      longerTerm: 'Sequence Website, Ops Portal, and Member Experience by business impact — not by novelty.',
    },
    consultantCoaching: [
      'Lead with empathy for the mission before any technology language.',
      'Watch for pride in community impact — mirror it back early.',
      'If budget concern surfaces, stay on outcomes and the smallest high-impact starting point.',
      `Use the ${persona.toLowerCase()} experience to create emotional connection.`,
      `Suggested open: show ${starting} first, then ask what felt most true.`,
    ],
    brand: {
      primary,
      accent,
      logoUrl: research.brand?.logoUrl || input.logoUrl || undefined,
      headline: research.brand?.headline || input.heroHeadline || profile.tagline || story,
      subhead: (research.brand?.subhead || profile.whatTheyOffer || profile.whoTheyAre || story).slice(0, 160),
      cta: research.brand?.cta || profile.primaryAsk || 'Get started',
    },
  };
}

export function parseOpportunityBriefLabeledText(text, fallback) {
  const fb = fallback;
  const learned = splitList(blockValue(text, 'WHAT_WE_LEARNED', 900), 5);
  const hidden = parseHiddenOpps(blockValue(text, 'HIDDEN_OPPORTUNITIES', 1200));
  const starters = splitList(blockValue(text, 'CONVERSATION_STARTERS', 900), 5);
  const questions = splitList(blockValue(text, 'DISCOVERY_QUESTIONS', 1000), 10);
  const strategySteps20 = splitList(blockValue(text, 'FLOW_20', 600), 5);
  const strategySteps45 = splitList(blockValue(text, 'FLOW_45', 800), 6);
  const coaching = splitList(blockValue(text, 'CONSULTANT_COACHING', 800), 6);
  const objections = parseObjections(blockValue(text, 'OBJECTIONS', 1200));
  const modules = splitList(blockValue(text, 'PORTAL_MODULES', 400), 8);
  const tiles = splitList(blockValue(text, 'MEMBER_TILES', 400), 6);
  const persona = blockValue(text, 'MEMBER_PERSONA', 40) || fb.member.persona;
  const primary = parseHexColor(blockValue(text, 'PRIMARY_COLOR', 20), fb.brand.primary);
  const accent = parseHexColor(blockValue(text, 'ACCENT_COLOR', 20), fb.brand.accent);
  const confidenceRaw = (blockValue(text, 'CONFIDENCE', 40) || '').toLowerCase();
  const overallConfidence = confidenceRaw.includes('high')
    ? 'high'
    : confidenceRaw.includes('thin') || confidenceRaw.includes('low')
      ? 'thin'
      : confidenceRaw.includes('medium')
        ? 'medium'
        : fb.overallConfidence;

  return {
    ...fb,
    industry: blockValue(text, 'INDUSTRY', 80) || fb.industry,
    primaryAudience: blockValue(text, 'PRIMARY_AUDIENCE', 160) || fb.primaryAudience,
    story: blockValue(text, 'STORY', 120) || fb.story,
    recommendedStartingPoint:
      blockValue(text, 'RECOMMENDED_STARTING_POINT', 80) || fb.recommendedStartingPoint,
    overallConfidence,
    whoTheyAre: blockValue(text, 'WHO_THEY_ARE', 700) || fb.whoTheyAre,
    whatWeLearned: learned.length ? learned : fb.whatWeLearned,
    hiddenOpportunities: hidden.length ? hidden : fb.hiddenOpportunities,
    website: {
      purpose: blockValue(text, 'WEBSITE_PURPOSE', 220) || fb.website.purpose,
      talkingPoint: blockValue(text, 'WEBSITE_TALKING', 220) || fb.website.talkingPoint,
      businessValue: blockValue(text, 'WEBSITE_VALUE', 220) || fb.website.businessValue,
    },
    portal: {
      purpose: blockValue(text, 'PORTAL_PURPOSE', 220) || fb.portal.purpose,
      talkingPoint: blockValue(text, 'PORTAL_TALKING', 220) || fb.portal.talkingPoint,
      businessValue: blockValue(text, 'PORTAL_VALUE', 220) || fb.portal.businessValue,
      modules: modules.length ? modules : fb.portal.modules,
    },
    member: {
      persona,
      purpose: blockValue(text, 'MEMBER_PURPOSE', 220) || fb.member.purpose,
      talkingPoint: blockValue(text, 'MEMBER_TALKING', 220) || fb.member.talkingPoint,
      businessValue: blockValue(text, 'MEMBER_VALUE', 220) || fb.member.businessValue,
      tiles: tiles.length ? tiles : memberTilesForPersona(persona),
    },
    conversationStarters: starters.length ? starters : fb.conversationStarters,
    discoveryQuestions: questions.length ? questions : fb.discoveryQuestions,
    objections: objections.length ? objections : fb.objections,
    meetingStrategy: {
      ...fb.meetingStrategy,
      showFirst: blockValue(text, 'SHOW_FIRST', 80) || fb.meetingStrategy.showFirst,
      discussFirst: blockValue(text, 'DISCUSS_FIRST', 160) || fb.meetingStrategy.discussFirst,
      mostCompelling: blockValue(text, 'MOST_COMPELLING', 160) || fb.meetingStrategy.mostCompelling,
      flow20: strategySteps20.length ? strategySteps20 : fb.meetingStrategy.flow20,
      flow45: strategySteps45.length ? strategySteps45 : fb.meetingStrategy.flow45,
    },
    nextSteps: {
      immediate: blockValue(text, 'NEXT_IMMEDIATE', 220) || fb.nextSteps.immediate,
      withinOneWeek: blockValue(text, 'NEXT_WEEK', 220) || fb.nextSteps.withinOneWeek,
      withinThirtyDays: blockValue(text, 'NEXT_THIRTY', 220) || fb.nextSteps.withinThirtyDays,
      longerTerm: blockValue(text, 'NEXT_LONGER', 220) || fb.nextSteps.longerTerm,
    },
    consultantCoaching: coaching.length ? coaching : fb.consultantCoaching,
    brand: {
      ...fb.brand,
      primary,
      accent,
      headline: blockValue(text, 'HEADLINE', 120) || fb.brand.headline,
      subhead: blockValue(text, 'SUBHEAD', 180) || fb.brand.subhead,
      cta: blockValue(text, 'CTA', 60) || fb.brand.cta,
    },
    scorecard: fb.scorecard,
  };
}

// Back-compat aliases for older imports during transition
export const buildExecutiveBriefFallback = buildOpportunityBriefFallback;
export const parseExecutiveBriefLabeledText = parseOpportunityBriefLabeledText;
