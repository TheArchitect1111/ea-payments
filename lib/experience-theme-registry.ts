export type ExperienceThemeDefinition = {
  id: string;
  label: string;
  description: string;
  appearance: 'light' | 'dark';
  supportedBlocks: string[];
  reusable: boolean;
};

export const EXPERIENCE_THEME_REGISTRY: ExperienceThemeDefinition[] = [
  {
    id: 'ea-default-theme',
    label: 'EA Default',
    description: 'Premium EA presentation system.',
    appearance: 'light',
    supportedBlocks: ['*'],
    reusable: true,
  },
  {
    id: 'amanda-editorial',
    label: 'Amanda Editorial',
    description: 'Warm, high-fashion editorial presentation for human-centered brands.',
    appearance: 'light',
    supportedBlocks: ['EAHero', 'EATextSection', 'EASplitNarrative', 'EAFeatures', 'EAMetrics', 'EACtaBand'],
    reusable: true,
  },
];

export function getExperienceThemeDefinition(id?: string): ExperienceThemeDefinition {
  return EXPERIENCE_THEME_REGISTRY.find((theme) => theme.id === id) ?? EXPERIENCE_THEME_REGISTRY[0];
}
