/**
 * Care Continuum Editorial — reusable premium healthcare storytelling grammar.
 * Data-driven only. No subject names, project IDs, or org hard-coding.
 */
import type { Data } from '@measured/puck';
import { scrubForbiddenPublicCopy } from '@/lib/factory-forbidden-copy.mjs';
import type { OrganizationStoryInput } from '@/lib/website-director';

export const CARE_CONTINUUM_SIGNATURE = 'care-continuum-editorial-v1';
export const CARE_CONTINUUM_THEME_ID = 'premium-care-editorial';

/** Preview-approved healthcare imagery pool (no phones/laptops/generic offices). */
export const CARE_CONTINUUM_MEDIA_POOL = {
  hero:
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=2000&q=80',
  clinician:
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1600&q=80',
  homeCare:
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80',
  family:
    'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80',
  calm:
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1600&q=80',
} as const;

export type CarePathway = {
  title: string;
  body: string;
};

export type CareMediaSlot = {
  url: string;
  caption?: string;
  /** Responsive focal hint — CSS uses this via data attributes / vars, not subject hacks. */
  focal?: 'face-right' | 'face-left' | 'center' | 'hands' | 'environment';
};

export type CareContinuumFields = {
  subjectName: string;
  subjectRole?: string;
  organizationName: string;
  brandHeadline: string;
  brandSubhead: string;
  introduction: string;
  roleExplainerTitle: string;
  roleExplainerBody: string;
  roleAttributionNote?: string;
  uncertaintyTitle: string;
  uncertaintyBody: string;
  clarityTitle: string;
  clarityBody: string;
  pathwaysIntro: string;
  pathways: [CarePathway, CarePathway, CarePathway];
  journeyBody: string;
  journeyListenBody: string;
  journeyConnectBody: string;
  geographyTitle: string;
  geographyBody: string;
  geographyAccent?: string;
  geographyCaption?: string;
  ctaTitle: string;
  ctaBody: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  footerTagline: string;
  footerAddress?: string;
  footerNote?: string;
  returnHref: string;
  primaryColor: string;
  accentColor: string;
  media: {
    hero: CareMediaSlot;
    clinician: CareMediaSlot;
    homeCare: CareMediaSlot;
    family: CareMediaSlot;
    calm: CareMediaSlot;
  };
};

const FORBIDDEN_PUBLIC =
  /story still being written|continue the conversation|how the work unfolds|documentary photography|full-bleed|researched public|lens craft|asymmetric editorial|composition signature|creative direction|narrative is asking|quiet step the narrative/i;

export function assertNoInternalCreativeCopy(blob: string) {
  if (FORBIDDEN_PUBLIC.test(blob)) {
    throw new Error('Internal creative-direction language leaked into public care-continuum copy.');
  }
}

const HEALTHCARE_SIGNAL =
  /\b(hospice|home\s*health|home\s*care|clinical\s*liaison|care\s*coordination|palliative|patient\s*care|nursing\s*care|skilled\s*nursing|caregiver|clinician|healthcare|health\s*care|medical\s*social\s*work)\b/i;

/** Theme selection: research/content signals — never subject identity. */
export function shouldUseCareContinuumEditorial(input: {
  organization: OrganizationStoryInput;
  primaryArchetype?: string;
}): boolean {
  if (input.primaryArchetype === 'The Caregiver') return true;
  const blob = [
    input.organization.organizationName,
    input.organization.industry,
    input.organization.whoTheyAre,
    input.organization.mission,
    input.organization.story,
    input.organization.whyTheyExist,
    input.organization.whoTheyHelp,
    input.organization.brandHeadline,
    input.organization.brandSubhead,
    ...(input.organization.differentiators || []),
    ...(input.organization.carePathways || []).map((p) => `${p.title} ${p.body}`),
    input.organization.subjectRole,
    input.organization.serviceGeography,
  ]
    .filter(Boolean)
    .join('\n');
  return HEALTHCARE_SIGNAL.test(blob);
}

function scrub(value: string | undefined, fallback: string): string {
  return scrubForbiddenPublicCopy(value) || fallback;
}

function pathwayTriple(
  pathways: CarePathway[] | undefined,
  organizationName: string,
): [CarePathway, CarePathway, CarePathway] {
  const cleaned = (pathways || [])
    .map((p) => ({
      title: scrubForbiddenPublicCopy(p.title) || '',
      body: scrubForbiddenPublicCopy(p.body) || '',
    }))
    .filter((p) => p.title && p.body);
  while (cleaned.length < 3) {
    const i = cleaned.length;
    cleaned.push(
      i === 0
        ? {
            title: 'Home-based care',
            body: `${organizationName} helps people receive skilled support where they live.`,
          }
        : i === 1
          ? {
              title: 'Family guidance',
              body: 'Clear conversations help households understand what is possible next.',
            }
          : {
              title: 'Continuum support',
              body: 'Pathways stay connected from the first question through ongoing care.',
            },
    );
  }
  return [cleaned[0]!, cleaned[1]!, cleaned[2]!];
}

function mediaFrom(
  slot: CareMediaSlot | undefined,
  fallback: CareMediaSlot,
): CareMediaSlot {
  if (slot?.url && !/phone|laptop|office|unsplash\.com\/photo-1576091160399/i.test(slot.url)) {
    return {
      url: slot.url,
      caption: scrubForbiddenPublicCopy(slot.caption) || fallback.caption,
      focal: slot.focal || fallback.focal,
    };
  }
  return fallback;
}

/**
 * Map director organization input → care continuum public fields.
 * All copy is scrubbed; creative-direction fields never enter.
 */
export function mapOrganizationToCareContinuumFields(
  organization: OrganizationStoryInput,
  options: { returnHref: string },
): CareContinuumFields {
  const subjectName = scrub(organization.organizationName, 'Care partner');
  const organizationName = scrub(
    organization.affiliatedOrganizationName || organization.organizationName,
    subjectName,
  );
  const role = scrubForbiddenPublicCopy(organization.subjectRole);
  const brandHeadline = scrub(
    organization.brandHeadline &&
      organization.brandHeadline !== organization.brandSubhead &&
      organization.brandHeadline.length <= 90
      ? organization.brandHeadline
      : undefined,
    role
      ? `A trusted guide between hospital, home, and family`
      : `${subjectName} — care that meets people where they live`,
  );
  const brandSubhead = scrub(
    organization.brandSubhead,
    role
      ? `${subjectName} serves as ${role}${organizationName !== subjectName ? ` with ${organizationName}` : ''}—helping patients, families, and care partners understand how compassionate care can meet them where they live.`
      : scrub(organization.story || organization.whoTheyAre, `${subjectName} helps people navigate care with clarity.`),
  );

  const introduction = scrub(
    organization.whoTheyAre || organization.biographyPublic || organization.story,
    `${subjectName}${role ? ` serves as ${role}` : ''}${
      organizationName !== subjectName ? ` with ${organizationName}` : ''
    }. This work helps people navigate the moment when care needs to move from facility to home—or when a family needs clarity about what support is possible next.`,
  );

  const roleExplainerBody = scrub(
    organization.roleExplainer || organization.mission || organization.whyTheyExist,
    role
      ? `In this role, specialists educate healthcare professionals, patients, families, and community partners on care pathways—translating clinical capability into a clear, human next step when a household is under stress.`
      : `Care teams help households understand options and connect to the right pathway with dignity, not guesswork.`,
  );

  const phone = scrubForbiddenPublicCopy(organization.contactPhone);
  const phoneHref =
    scrubForbiddenPublicCopy(organization.contactPhoneHref) ||
    (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '');
  const orgUrl = scrubForbiddenPublicCopy(organization.organizationUrl) || options.returnHref;
  const primaryHref = phoneHref || orgUrl;
  const primaryLabel = phone
    ? `Call ${phone}`
    : scrub(organization.brandCta, `Contact ${organizationName}`);

  const fields: CareContinuumFields = {
    subjectName,
    subjectRole: role,
    organizationName,
    brandHeadline,
    brandSubhead,
    introduction,
    roleExplainerTitle: role ? 'How this role helps' : 'How care coordination helps',
    roleExplainerBody,
    roleAttributionNote: organization.roleAttributionNote
      ? scrubForbiddenPublicCopy(organization.roleAttributionNote)
      : organizationName !== subjectName
        ? `Organizational capabilities attributed to ${organizationName}, not as personal accomplishments.`
        : undefined,
    uncertaintyTitle: 'Too many options, too little clarity',
    uncertaintyBody: scrub(
      organization.whoTheyHelp,
      'Discharge paperwork, unfamiliar terms, and competing advice can leave families unsure which pathway is the right fit.',
    ),
    clarityTitle: 'A calm, informed conversation',
    clarityBody: scrub(
      organization.whatChanges,
      'A clear conversation maps the situation to the right care pathway—so families and referring partners can choose with dignity.',
    ),
    pathwaysIntro: scrub(
      organization.pathwaysIntro,
      organizationName !== subjectName
        ? `These pathways belong to ${organizationName}. Liaison and coordination work helps people understand and access them—not claim them as personal accomplishments.`
        : `These care pathways help households move from question to support.`,
    ),
    pathways: pathwayTriple(organization.carePathways, organizationName),
    journeyBody: scrub(
      organization.whyItMatters,
      'Most journeys begin with a question: Can we manage this at home? Is a different level of care the right conversation? Coordination helps families and referring clinicians sort those questions, then points to the right intake path.',
    ),
    journeyListenBody:
      'Understand the clinical situation, the home environment, and what matters most to the patient and family.',
    journeyConnectBody:
      scrubForbiddenPublicCopy(organization.journeyConnectBody) ||
      `Explain the relevant pathway and connect the household to intake—with clear expectations about what care can provide.`,
    geographyTitle: scrub(
      organization.serviceGeographyTitle,
      organization.serviceGeography
        ? `Care rooted in ${organization.serviceGeography}`
        : 'Care rooted in the communities served',
    ),
    geographyBody: scrub(
      organization.serviceGeographyBody || organization.serviceGeography,
      `${organizationName} serves people across its care region with home-based and continuum support.`,
    ),
    geographyAccent: scrubForbiddenPublicCopy(organization.geographyAccent),
    geographyCaption: scrubForbiddenPublicCopy(organization.geographyCaption),
    ctaTitle: 'Ready to talk about the next step?',
    ctaBody: scrub(
      organization.ctaBody,
      `For care questions and referrals, contact ${organizationName} directly. Coordination exists to make that first conversation clearer—not to replace clinical intake.`,
    ),
    primaryCtaLabel: primaryLabel,
    primaryCtaHref: primaryHref,
    secondaryCtaLabel: scrub(
      organization.secondaryCtaLabel,
      organizationName !== subjectName ? `Explore ${organizationName}` : 'Learn more',
    ),
    secondaryCtaHref: orgUrl,
    footerTagline: scrub(
      organization.footerTagline,
      role
        ? `${role} supporting access to ${organizationName}`
        : `Supporting access to compassionate care`,
    ),
    footerAddress: scrubForbiddenPublicCopy(organization.footerAddress),
    footerNote: scrub(
      organization.footerNote,
      'Preview draft — organizational facts attributed to the affiliated organization when present. Personal role stated only when verified.',
    ),
    returnHref: options.returnHref,
    primaryColor: organization.primaryColor || '#1B3A4B',
    accentColor: organization.accentColor || '#7BA3A8',
    media: {
      hero: mediaFrom(organization.mediaSlots?.hero, {
        url: CARE_CONTINUUM_MEDIA_POOL.hero,
        caption: undefined,
        focal: 'face-right',
      }),
      clinician: mediaFrom(organization.mediaSlots?.clinician, {
        url: CARE_CONTINUUM_MEDIA_POOL.clinician,
        caption: 'Clinician coordination that keeps families informed and grounded.',
        focal: 'face-left',
      }),
      homeCare: mediaFrom(organization.mediaSlots?.homeCare, {
        url: CARE_CONTINUUM_MEDIA_POOL.homeCare,
        caption: 'Home health brings skilled support into the place people call home.',
        focal: 'center',
      }),
      family: mediaFrom(organization.mediaSlots?.family, {
        url: CARE_CONTINUUM_MEDIA_POOL.family,
        caption: 'Family support is part of care—not an afterthought.',
        focal: 'hands',
      }),
      calm: mediaFrom(organization.mediaSlots?.calm, {
        url: CARE_CONTINUUM_MEDIA_POOL.calm,
        caption: 'Care that meets people where they live.',
        focal: 'environment',
      }),
    },
  };

  assertNoInternalCreativeCopy(JSON.stringify(fields));
  return fields;
}

function blockId(prefix: string, index: number) {
  return `care-${prefix}-${index}`;
}

/**
 * Emit complete premium care-continuum puck page from mapped fields.
 */
export function composeCareContinuumEditorialPuck(fields: CareContinuumFields): Data {
  let n = 0;
  const id = (prefix: string) => blockId(prefix, ++n);
  const navNote = [fields.subjectRole, fields.organizationName !== fields.subjectName ? fields.organizationName : '']
    .filter(Boolean)
    .join(' · ');

  const content: Data['content'] = [
    {
      type: 'EASiteNav',
      props: {
        id: id('nav'),
        brand: fields.subjectName,
        brandNote: navNote,
        links: [
          { label: 'About', href: '#about' },
          { label: 'Role', href: '#role' },
          { label: 'Care', href: '#pathways' },
          { label: 'Journey', href: '#journey' },
          { label: 'Refer', href: '#refer' },
        ],
        ctaLabel: fields.primaryCtaLabel.replace(/^Call\s+/i, 'Call ').slice(0, 28),
        ctaHref: fields.primaryCtaHref,
      },
    },
    {
      type: 'EAHero',
      props: {
        id: id('hero'),
        variant: 'threshold',
        eyebrow: fields.organizationName,
        title: fields.brandHeadline,
        subtitle: fields.brandSubhead,
        ctaLabel: fields.primaryCtaLabel.startsWith('Call')
          ? fields.primaryCtaLabel
          : `Speak with ${fields.organizationName}`,
        ctaHref: fields.primaryCtaHref,
        imageUrl: fields.media.hero.url,
        focal: fields.media.hero.focal || 'face-right',
      },
    },
    {
      type: 'EATextSection',
      props: {
        id: id('about'),
        variant: 'legacy',
        label: 'Introduction',
        title: `Meet ${fields.subjectName}`,
        body: fields.introduction,
        accentValue: '',
        accentCaption: '',
        anchorId: 'about',
        scale: 'lg',
      },
    },
    {
      type: 'EAImageBand',
      props: {
        id: id('img-clinician'),
        imageUrl: fields.media.clinician.url,
        caption: fields.media.clinician.caption || '',
        objectPosition: 'center 20%',
        focal: fields.media.clinician.focal || 'face-left',
      },
    },
    {
      type: 'EAOverlapScene',
      props: {
        id: id('role'),
        label: fields.subjectRole || 'Care coordination',
        title: fields.roleExplainerTitle,
        body: fields.roleExplainerBody,
        note: fields.roleAttributionNote || '',
        imageUrl: fields.media.homeCare.url,
        focal: fields.media.homeCare.focal || 'center',
        anchorId: 'role',
      },
    },
    {
      type: 'EASplitNarrative',
      props: {
        id: id('split-clarity'),
        label: 'What changes',
        title: 'From open questions to a workable plan',
        leftLabel: 'When families feel stuck',
        leftTitle: fields.uncertaintyTitle,
        leftBody: fields.uncertaintyBody,
        rightLabel: 'What coordination offers',
        rightTitle: fields.clarityTitle,
        rightBody: fields.clarityBody,
      },
    },
    {
      type: 'EATextSection',
      props: {
        id: id('pathways-intro'),
        variant: 'mission-plane',
        label: 'Care pathways',
        title: `Services offered by ${fields.organizationName}`,
        body: fields.pathwaysIntro,
        accentValue: '',
        accentCaption: '',
        anchorId: 'pathways',
        scale: 'md',
      },
    },
    {
      type: 'EAPathwayStrip',
      props: {
        id: id('pathways'),
        label: 'Pathways',
        title: 'Home care, hospice, and continuum support',
        oneTitle: fields.pathways[0].title,
        oneBody: fields.pathways[0].body,
        twoTitle: fields.pathways[1].title,
        twoBody: fields.pathways[1].body,
        threeTitle: fields.pathways[2].title,
        threeBody: fields.pathways[2].body,
      },
    },
    {
      type: 'EAImageBand',
      props: {
        id: id('img-family'),
        imageUrl: fields.media.family.url,
        caption: fields.media.family.caption || '',
        objectPosition: 'center 40%',
        focal: fields.media.family.focal || 'hands',
      },
    },
    {
      type: 'EATextSection',
      props: {
        id: id('journey'),
        variant: 'proof',
        label: 'Patient & family journey',
        title: 'A compassionate path from question to care',
        body: fields.journeyBody,
        accentValue: '',
        accentCaption: '',
        anchorId: 'journey',
        scale: 'lg',
      },
    },
    {
      type: 'EASplitNarrative',
      props: {
        id: id('journey-steps'),
        label: 'Journey',
        title: 'What families can expect',
        leftLabel: 'Step one',
        leftTitle: 'Listen and orient',
        leftBody: fields.journeyListenBody,
        rightLabel: 'Step two',
        rightTitle: 'Match and connect',
        rightBody: fields.journeyConnectBody,
      },
    },
    {
      type: 'EAImageBand',
      props: {
        id: id('img-calm'),
        imageUrl: fields.media.calm.url,
        caption: fields.media.calm.caption || '',
        objectPosition: 'center 30%',
        focal: fields.media.calm.focal || 'environment',
      },
    },
    {
      type: 'EATextSection',
      props: {
        id: id('region'),
        variant: 'legacy',
        label: 'Service area',
        title: fields.geographyTitle,
        body: fields.geographyBody,
        accentValue: fields.geographyAccent || '',
        accentCaption: fields.geographyCaption || '',
        anchorId: 'region',
        scale: 'md',
      },
    },
    {
      type: 'EACtaBand',
      props: {
        id: id('cta'),
        variant: 'belonging',
        title: fields.ctaTitle,
        body: fields.ctaBody,
        primaryLabel: fields.primaryCtaLabel,
        primaryHref: fields.primaryCtaHref,
        secondaryLabel: fields.secondaryCtaLabel,
        secondaryHref: fields.secondaryCtaHref,
        anchorId: 'refer',
      },
    },
    {
      type: 'EASiteFooter',
      props: {
        id: id('footer'),
        brand: fields.subjectName,
        tagline: fields.footerTagline,
        columns: [
          {
            title: 'On this page',
            links: [
              { label: 'About', href: '#about' },
              { label: 'Role', href: '#role' },
              { label: 'Pathways', href: '#pathways' },
              { label: 'Refer', href: '#refer' },
            ],
          },
          {
            title: fields.organizationName,
            links: [
              { label: fields.secondaryCtaLabel, href: fields.secondaryCtaHref },
              ...(fields.primaryCtaHref.startsWith('tel:')
                ? [{ label: fields.primaryCtaLabel, href: fields.primaryCtaHref }]
                : []),
            ],
          },
        ],
        address: fields.footerAddress || '',
        note: fields.footerNote || '',
        returnLabel: 'Return to concept review',
        returnHref: fields.returnHref,
      },
    },
  ];

  const data = {
    root: {
      props: {
        title: `${fields.subjectName} · ${fields.subjectRole || 'Care'} · ${fields.organizationName}`,
        primaryColor: fields.primaryColor,
        accentColor: fields.accentColor,
        themeId: CARE_CONTINUUM_THEME_ID,
        compositionSignature: CARE_CONTINUUM_SIGNATURE,
      },
    },
    content,
  };

  assertNoInternalCreativeCopy(JSON.stringify(data));
  return data as Data;
}

export function buildCareContinuumPortalShell(fields: CareContinuumFields) {
  return {
    tone: 'Calm, clinical, family-centered continuity from the public story',
    composition: 'Member home with shared imagery and clear next referral action',
    purpose:
      'A private continuation for families and referring partners after learning about the care pathway.',
    firstView: [
      'Messages from your care team',
      'Referral status',
      'Service guides',
      'After-hours contacts',
      'Family resources',
    ],
    primaryColor: fields.primaryColor,
    accentColor: fields.accentColor,
    themeId: CARE_CONTINUUM_THEME_ID,
    organizationName: fields.subjectName,
    brandHeadline: fields.subjectRole
      ? `${fields.subjectRole} · ${fields.organizationName}`
      : fields.brandHeadline,
    brandSubhead: fields.brandSubhead.slice(0, 160),
    memberWhere: 'You are reviewing a care pathway with trusted coordination context.',
    memberNext: fields.primaryCtaLabel,
    heroImageUrl: fields.media.hero.url,
  };
}
