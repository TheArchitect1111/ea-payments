/**
 * Curated Concept A for Kristina Brickey × 3HC — public copy only.
 * Internal creative-direction language never enters this schema.
 *
 * Evidence rules:
 * - Personal: Clinical Liaison role at 3HC (project clarification / verified identity).
 * - Organizational: 3HC services, geography, phone — attributed to 3HC.org, not to Kristina.
 */
import type { Data } from '@measured/puck';

export const KRISTINA_PROJECT_ID = 'proj-ms68dh4m-3daac7';
export const KRISTINA_CONCEPT_A_ID = 'workorder-website-p1-concept-a';

/** Preview-only healthcare imagery — home care / family / clinical coordination. No phones, laptops, offices. */
export const KRISTINA_MEDIA = {
  hero:
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=2000&q=80',
  family:
    'https://images.unsplash.com/photo-1581579438747-1dc8d64bb2eb?auto=format&fit=crop&w=1600&q=80',
  clinician:
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
  homeCare:
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80',
  calmHome:
    'https://images.unsplash.com/photo-1576765608866-5b51046452a7?auto=format&fit=crop&w=1600&q=80',
} as const;

export type KristinaEvidenceRow = {
  section: string;
  claim: string;
  attribution: 'Kristina Brickey' | '3HC' | 'Preview UX';
  source: string;
};

export const KRISTINA_EVIDENCE_TABLE: KristinaEvidenceRow[] = [
  {
    section: 'Hero / Introduction',
    claim: 'Kristina Brickey serves as a Clinical Liaison at 3HC.',
    attribution: 'Kristina Brickey',
    source: 'Factory project identity / distinguishing detail (Clinical Liaison at 3HC)',
  },
  {
    section: 'How a clinical liaison helps',
    claim:
      '3HC Clinical Liaisons educate healthcare professionals, patients, and families on agency capabilities and care pathways.',
    attribution: '3HC',
    source: 'https://www.3hc.org/clinical-education/',
  },
  {
    section: '3HC service pathways',
    claim:
      '3HC provides home health care, home hospice, inpatient hospice, after-hours care, veterans care, and pediatric hospice.',
    attribution: '3HC',
    source: 'https://www.3hc.org/',
  },
  {
    section: 'Home health detail',
    claim:
      '3HC home health includes nursing & aide services, medical social work, and physical / occupational / speech therapy.',
    attribution: '3HC',
    source: 'https://www.3hc.org/services/home-health-care/',
  },
  {
    section: 'Eastern NC context',
    claim:
      '3HC has served Eastern North Carolina since 1981; headquarters at 2402 Wayne Memorial Drive, Goldsboro, NC.',
    attribution: '3HC',
    source: 'https://www.3hc.org/',
  },
  {
    section: 'Contact / referral',
    claim: '3HC phone for assistance: 1-800-692-4442.',
    attribution: '3HC',
    source: 'https://www.3hc.org/',
  },
  {
    section: 'CTAs',
    claim: 'Preview demo contact is intentionally non-routing; live call uses 3HC number.',
    attribution: 'Preview UX',
    source: 'Honest preview state (no invented personal contact for Kristina)',
  },
];

const FORBIDDEN_PUBLIC =
  /story still being written|continue the conversation|how the work unfolds|documentary photography|full-bleed|researched public|lens craft|asymmetric editorial|composition signature|creative direction/i;

export function isKristinaConceptA(projectId: string, conceptId: string, clientName?: string): boolean {
  if (projectId === KRISTINA_PROJECT_ID && /concept-a\b/i.test(conceptId)) return true;
  if (/kristina\s+brickey/i.test(clientName || '') && /concept-a\b/i.test(conceptId)) return true;
  return false;
}

export function assertNoInternalCopy(blob: string) {
  if (FORBIDDEN_PUBLIC.test(blob)) {
    throw new Error(`Internal creative-direction language leaked into public Kristina Concept A copy.`);
  }
}

/**
 * Complete premium healthcare storytelling page for Concept A only.
 */
export function buildKristinaConceptAPuckData(input: {
  projectId: string;
  returnHref: string;
}): Data {
  const phoneHref = 'tel:+18006924442';
  const orgHref = 'https://www.3hc.org/';
  const homeHealthHref = 'https://www.3hc.org/services/home-health-care/';
  const hospiceHref = 'https://www.3hc.org/services/hospice-care/';

  const content = {
    root: {
      props: {
        title: 'Kristina Brickey · Clinical Liaison · 3HC',
        primaryColor: '#1B3A4B',
        accentColor: '#7BA3A8',
        themeId: 'kristina-3hc-editorial',
        factoryConceptId: KRISTINA_CONCEPT_A_ID,
        factoryConceptName: 'Compassionate Continuum',
        compositionSignature: 'kristina-3hc-curated-v1',
      },
    },
    content: [
      {
        type: 'EASiteNav',
        props: {
          brand: 'Kristina Brickey',
          brandNote: 'Clinical Liaison · 3HC',
          links: [
            { label: 'About', href: '#about' },
            { label: 'The liaison role', href: '#liaison' },
            { label: '3HC care', href: '#services' },
            { label: 'Your journey', href: '#journey' },
            { label: 'Eastern NC', href: '#region' },
            { label: 'Refer', href: '#refer' },
          ],
          ctaLabel: 'Call 3HC',
          ctaHref: phoneHref,
        },
      },
      {
        type: 'EAHero',
        props: {
          variant: 'threshold',
          eyebrow: '3HC Home Health & Hospice Care',
          title: 'A trusted guide between hospital, home, and family',
          subtitle:
            'Kristina Brickey is a Clinical Liaison at 3HC—helping patients, families, and care partners understand how compassionate home health and hospice can meet them where they live.',
          ctaLabel: 'Speak with 3HC',
          ctaHref: phoneHref,
          imageUrl: KRISTINA_MEDIA.hero,
        },
      },
      {
        type: 'EATextSection',
        props: {
          variant: 'legacy',
          label: 'Introduction',
          title: 'Meet Kristina Brickey',
          body: 'Kristina Brickey serves as a Clinical Liaison with 3HC, the Eastern North Carolina nonprofit that has provided home health and hospice care since 1981. In this role, she helps people navigate the moment when care needs to move from facility to home—or when a family needs clarity about what support is possible next.',
          accentValue: '',
          accentCaption: '',
          anchorId: 'about',
        },
      },
      {
        type: 'EAImageBand',
        props: {
          imageUrl: KRISTINA_MEDIA.clinician,
          caption: 'Clinician coordination that keeps families informed and grounded.',
          objectPosition: 'center 25%',
        },
      },
      {
        type: 'EATextSection',
        props: {
          variant: 'documentary',
          label: 'The liaison role',
          title: 'How a clinical liaison helps',
          body: 'At 3HC, Clinical Liaisons and Community Relations specialists educate healthcare professionals, patients, families, church groups, and civic partners on the full scope of services the agency provides. They are a bridge—translating clinical capability into a clear, human next step when a household is under stress.',
          accentValue: '',
          accentCaption: 'Attributed to 3HC Clinical Education, not as a personal claim about Kristina alone.',
          anchorId: 'liaison',
        },
      },
      {
        type: 'EASplitNarrative',
        props: {
          label: 'What changes',
          title: 'From uncertainty to a workable plan',
          leftLabel: 'When families feel stuck',
          leftTitle: 'Too many options, too little clarity',
          leftBody:
            'Discharge paperwork, unfamiliar terms, and competing advice can leave families unsure whether home health, hospice, or another pathway is the right fit.',
          rightLabel: 'What a liaison offers',
          rightTitle: 'A calm, informed conversation',
          rightBody:
            'A Clinical Liaison helps map the situation to 3HC’s care pathways—so families and referring partners can choose with dignity, not guesswork.',
        },
      },
      {
        type: 'EAImageBand',
        props: {
          imageUrl: KRISTINA_MEDIA.homeCare,
          caption: 'Home health brings skilled support into the place people call home.',
          objectPosition: 'center 40%',
        },
      },
      {
        type: 'EATextSection',
        props: {
          variant: 'mission-plane',
          label: '3HC care pathways',
          title: 'Services offered by 3HC',
          body: 'These pathways belong to 3HC as an organization. Kristina’s liaison work helps people understand and access them—not claim them as personal accomplishments.',
          accentValue: '',
          accentCaption: '',
          anchorId: 'services',
        },
      },
      {
        type: 'EAFeatures',
        props: {
          label: 'Pathways',
          title: 'Home health, hospice, and continuum support',
          featureOneTitle: 'Home Health Care',
          featureOneBody:
            'Nursing and aide services, medical social work, and rehabilitation therapies (physical, occupational, and speech) for people recovering at home.',
          featureTwoTitle: 'Home & Inpatient Hospice',
          featureTwoBody:
            'Physical, emotional, and spiritual support for terminal illness—at home or in inpatient hospice when needs can no longer be managed at home.',
          featureThreeTitle: 'After-hours, Veterans & Pediatric',
          featureThreeBody:
            'Continuity beyond business hours, dedicated veterans care, and pediatric hospice pathways for families who need specialized support.',
        },
      },
      {
        type: 'EAImageBand',
        props: {
          imageUrl: KRISTINA_MEDIA.family,
          caption: 'Family support is part of care—not an afterthought.',
          objectPosition: 'center 35%',
        },
      },
      {
        type: 'EATextSection',
        props: {
          variant: 'proof',
          label: 'Patient & family journey',
          title: 'A compassionate path from question to care',
          body: 'Most journeys begin with a question: Can we manage this at home? Is hospice the right conversation? A liaison helps families and referring clinicians sort those questions against 3HC’s offerings, then points to the right intake path—so the household is not left alone with the paperwork.',
          accentValue: '',
          accentCaption: '',
          anchorId: 'journey',
        },
      },
      {
        type: 'EASplitNarrative',
        props: {
          label: 'Journey',
          title: 'What families can expect',
          leftLabel: 'Step one',
          leftTitle: 'Listen and orient',
          leftBody:
            'Understand the clinical situation, the home environment, and what matters most to the patient and family.',
          rightLabel: 'Step two',
          rightTitle: 'Match and connect',
          rightBody:
            'Explain the relevant 3HC pathway and connect the household to intake—with clear expectations about what home health or hospice can provide.',
        },
      },
      {
        type: 'EAImageBand',
        props: {
          imageUrl: KRISTINA_MEDIA.calmHome,
          caption: 'Care that respects the quiet of home.',
          objectPosition: 'center 45%',
        },
      },
      {
        type: 'EATextSection',
        props: {
          variant: 'legacy',
          label: 'Eastern North Carolina',
          title: 'Care rooted in the communities 3HC serves',
          body: '3HC has provided compassionate care to North Carolinians since 1981, serving counties from the Triangle toward the coast. The organization is headquartered in Goldsboro at 2402 Wayne Memorial Drive—close to the hospitals, clinics, and households that rely on home-based care across Eastern NC.',
          accentValue: 'Since 1981',
          accentCaption: '3HC Home Health & Hospice Care · Eastern North Carolina',
          anchorId: 'region',
        },
      },
      {
        type: 'EACtaBand',
        props: {
          variant: 'belonging',
          title: 'Ready to talk about the next step?',
          body: 'For care questions and referrals, contact 3HC directly. Kristina’s liaison work exists to make that first conversation clearer—not to replace clinical intake.',
          primaryLabel: 'Call 1-800-692-4442',
          primaryHref: phoneHref,
          secondaryLabel: 'Explore 3HC services',
          secondaryHref: orgHref,
          anchorId: 'refer',
        },
      },
      {
        type: 'EASiteFooter',
        props: {
          brand: 'Kristina Brickey',
          tagline: 'Clinical Liaison supporting access to 3HC Home Health & Hospice Care',
          columns: [
            {
              title: 'On this page',
              links: [
                { label: 'About Kristina', href: '#about' },
                { label: 'Liaison role', href: '#liaison' },
                { label: '3HC pathways', href: '#services' },
                { label: 'Refer / call', href: '#refer' },
              ],
            },
            {
              title: '3HC',
              links: [
                { label: 'Home Health', href: homeHealthHref },
                { label: 'Hospice Care', href: hospiceHref },
                { label: '3HC.org', href: orgHref },
                { label: '1-800-692-4442', href: phoneHref },
              ],
            },
          ],
          address: '3HC · 2402 Wayne Memorial Drive · Goldsboro, NC 27534',
          note: 'Preview draft — not an official 3HC publication. Organizational facts attributed to 3HC.org. Personal role: Clinical Liaison.',
          returnLabel: 'Return to concept review',
          returnHref: input.returnHref,
        },
      },
    ],
  };

  assertNoInternalCopy(JSON.stringify(content));
  return content as Data;
}

export function buildKristinaConceptAPortalShell(heroImageUrl: string) {
  return {
    tone: 'Calm, clinical, family-centered continuity from the public story',
    composition: 'Member home with shared imagery and clear next referral action',
    purpose:
      'A private continuation for families and referring partners after learning about the liaison pathway.',
    firstView: [
      'Messages from your care team',
      'Referral status',
      '3HC service guides',
      'After-hours contacts',
      'Family resources',
    ],
    primaryColor: '#1B3A4B',
    accentColor: '#7BA3A8',
    themeId: 'kristina-3hc-editorial',
    organizationName: 'Kristina Brickey',
    brandHeadline: 'Clinical Liaison · 3HC',
    brandSubhead: 'Guiding families toward the right home health or hospice pathway',
    memberWhere: 'You are reviewing a care pathway with a trusted liaison context.',
    memberNext: 'Call 3HC at 1-800-692-4442 or open the service guide that matches your need.',
    heroImageUrl,
  };
}
