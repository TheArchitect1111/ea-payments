import type { Data } from '@measured/puck';

export type ExperiencePageStatus = 'draft' | 'published';

export interface ExperiencePage {
  id: string;
  organizationId: string;
  portalSlug: string;
  title: string;
  status: ExperiencePageStatus;
  puckData: Data;
  updatedAt: string;
  publishedAt?: string;
  previewPath: string;
}

export function createEmptyPuckData(title = 'New experience'): Data {
  return {
    root: { props: { title } },
    content: [
      {
        type: 'EAHero',
        props: {
          id: 'hero-1',
          eyebrow: 'Efficiency Architects',
          title: title,
          subtitle: 'Describe what becomes possible for your audience.',
          ctaLabel: 'Take the next step',
          ctaHref: '/assessment',
        },
      },
    ],
    zones: {},
  };
}

export function previewPathForPage(portalSlug: string, pageId: string): string {
  return `/preview/experience/${portalSlug}/${pageId}`;
}
