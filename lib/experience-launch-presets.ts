import type { WebsitePortalProvisionInput } from '@/lib/provision-website-portal';

export type ExperienceLaunchPreset = {
  id: string;
  label: string;
  description: string;
  provision: WebsitePortalProvisionInput;
};

export const EXPERIENCE_LAUNCH_PRESETS: ExperienceLaunchPreset[] = [
  {
    id: 'amanda-catherine-editorial',
    label: 'Amanda Catherine Editorial',
    description: 'Premium editorial website and portal experience on the EA Chassis.',
    provision: {
      portalSlug: 'amanda-catherine',
      businessName: 'Amanda Catherine',
      organizationName: 'Amanda Catherine',
      themeId: 'amanda-editorial',
      headline: 'Turn your gifts into purpose, impact, and sustainable opportunity.',
      tagline: 'Helping people transform creativity, wellness, education, and empowerment into meaningful work.',
      ctaLabel: 'Find Your Path',
      primaryColor: '#17130F',
      accentColor: '#B9894D',
      industry: 'Personal Brand, Education, Wellness, and Speaking',
      brandVoice: 'Warm, human, elevated, editorial, encouraging, and purpose-led.',
      whoTheyAre:
        'Amanda Catherine is a creator, entrepreneur, wellness advocate, author, speaker, and mentor who helps people recognize and develop their gifts.',
      mission:
        'Help people transform creativity, wellness, education, and empowerment into lives and businesses that make a meaningful difference.',
      story:
        'Every person carries gifts with the potential to become purpose, impact, and sustainable opportunity. The experience helps each visitor find the path that calls to them.',
      whyTheyExist:
        'To help people discover their gifts, develop their potential, and build lives of purpose, freedom, and impact.',
      whoTheyHelp:
        'Creators, entrepreneurs, wellness seekers, emerging speakers, partners, and people who are ready to find their next path.',
      whyItMatters:
        'Too many valuable gifts remain ideas because people lack a trusted path from possibility to meaningful action.',
      whatChanges:
        'Visitors leave with clarity about where they belong, what to do next, and how Amanda Catherine can guide their journey.',
      primaryAudience:
        'Purpose-led creators, entrepreneurs, wellness seekers, speakers, and strategic partners.',
      differentiators: [
        'Creativity, wellness, education, and empowerment united in one experience',
        'Multiple clear paths without a corporate or transactional feel',
        'Human guidance grounded in lived experience and sustainable impact',
        'Premium editorial storytelling connected to practical next steps',
      ],
      member: {
        whereYouAre: 'Your Amanda Catherine experience is ready.',
        whatNext: 'Choose the path that best matches what you want to create, heal, learn, share, or build.',
        purpose: 'Turn your gifts into purpose, impact, and sustainable opportunity.',
        whatSuccessLooksLike: 'A clear next step and a guided path toward meaningful progress.',
      },
      force: true,
    },
  },
];

export function getExperienceLaunchPreset(id: string): ExperienceLaunchPreset | undefined {
  return EXPERIENCE_LAUNCH_PRESETS.find((preset) => preset.id === id);
}
