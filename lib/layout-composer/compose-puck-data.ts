import type { Data } from '@measured/puck';
import { composeScenesFromDirection } from './compose-scenes';
import type { CompositionId, LayoutComposerInput } from './types';

type PuckBlock = Data['content'][number];

function blockId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function emitComposition(
  compositionId: CompositionId,
  copy: LayoutComposerInput['director']['scenes'][number]['copy'],
  index: number,
  hrefs: { portal: string; site: string },
): PuckBlock {
  switch (compositionId) {
    case 'human_threshold_bleed':
      return {
        type: 'EAHero',
        props: {
          id: blockId('human', index),
          variant: 'threshold',
          eyebrow: copy.eyebrow || '',
          title: copy.title,
          subtitle: copy.subtitle || copy.body,
          ctaLabel: copy.ctaLabel || 'Continue',
          ctaHref: copy.ctaHref || '#invite',
          imageUrl: copy.imageUrl || '',
        },
      };
    case 'human_companion_centered':
      return {
        type: 'EAHero',
        props: {
          id: blockId('human', index),
          variant: 'companion',
          eyebrow: copy.eyebrow || 'With you',
          title: copy.title,
          subtitle: copy.subtitle || copy.body,
          ctaLabel: copy.ctaLabel || 'Begin',
          ctaHref: copy.ctaHref || '#invite',
          imageUrl: copy.imageUrl || '',
        },
      };
    case 'human_craft_detail':
      return {
        type: 'EAHero',
        props: {
          id: blockId('human', index),
          variant: 'craft',
          eyebrow: copy.eyebrow || 'Craft',
          title: copy.title,
          subtitle: copy.subtitle || copy.body,
          ctaLabel: copy.ctaLabel || 'View the work',
          ctaHref: copy.ctaHref || '#invite',
          imageUrl: copy.imageUrl || '',
        },
      };
    case 'reality_documentary_stat':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('reality', index),
          variant: 'documentary',
          label: copy.label || 'Now',
          title: copy.title,
          body: copy.body,
          accentValue: copy.statValue || '',
          accentCaption: copy.statCaption || '',
        },
      };
    case 'reality_confrontational':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('reality', index),
          variant: 'confrontational',
          label: copy.label || 'The truth',
          title: copy.title,
          body: copy.body,
          accentValue: copy.statValue || '',
          accentCaption: copy.statCaption || '',
        },
      };
    case 'mission_plane_full':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('mission', index),
          variant: 'mission-plane',
          label: copy.label || 'Mission',
          title: copy.title,
          body: copy.body,
          accentValue: '',
          accentCaption: '',
        },
      };
    case 'mission_legacy_quiet':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('mission', index),
          variant: 'legacy',
          label: copy.label || 'Continuity',
          title: copy.title,
          body: copy.body,
          accentValue: '',
          accentCaption: '',
        },
      };
    case 'transform_split_editorial':
      return {
        type: 'EASplitNarrative',
        props: {
          id: blockId('transform', index),
          label: copy.label || 'Change',
          title: copy.title,
          leftLabel: copy.leftLabel || 'Before',
          leftTitle: copy.leftTitle || 'Before',
          leftBody: copy.leftBody || copy.body,
          rightLabel: copy.rightLabel || 'After',
          rightTitle: copy.rightTitle || 'After',
          rightBody: copy.rightBody || copy.body,
        },
      };
    case 'process_sparse_steps':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('process', index),
          variant: 'process',
          label: copy.label || 'How',
          title: copy.title,
          body: copy.body,
          accentValue: '',
          accentCaption: '',
        },
      };
    case 'proof_trust_statement':
      return {
        type: 'EATextSection',
        props: {
          id: blockId('proof', index),
          variant: 'proof',
          label: copy.label || 'Trust',
          title: copy.title,
          body: copy.body,
          accentValue: '',
          accentCaption: '',
        },
      };
    case 'impact_editorial_figures':
      return {
        type: 'EAMetrics',
        props: {
          id: blockId('impact', index),
          variant: 'editorial',
          label: copy.label || 'Impact',
          title: copy.title,
          metricOneValue: copy.metricOneValue || '—',
          metricOneLabel: copy.metricOneLabel || copy.body.slice(0, 80),
          metricTwoValue: copy.metricTwoValue || '',
          metricTwoLabel: copy.metricTwoLabel || '',
          metricThreeValue: copy.metricThreeValue || '',
          metricThreeLabel: copy.metricThreeLabel || '',
        },
      };
    case 'invitation_belonging':
      return {
        type: 'EACtaBand',
        props: {
          id: blockId('invite', index),
          variant: 'belonging',
          title: copy.title,
          body: copy.body,
          primaryLabel: copy.ctaLabel || 'Join us',
          primaryHref: copy.ctaHref || hrefs.portal,
          secondaryLabel: copy.secondaryLabel || 'View this site',
          secondaryHref: copy.secondaryHref || hrefs.site,
        },
      };
    case 'invitation_commission':
      return {
        type: 'EACtaBand',
        props: {
          id: blockId('invite', index),
          variant: 'commission',
          title: copy.title,
          body: copy.body,
          primaryLabel: copy.ctaLabel || 'Commission',
          primaryHref: copy.ctaHref || hrefs.portal,
          secondaryLabel: copy.secondaryLabel || 'View this site',
          secondaryHref: copy.secondaryHref || hrefs.site,
        },
      };
    case 'invitation_protect':
      return {
        type: 'EACtaBand',
        props: {
          id: blockId('invite', index),
          variant: 'protect',
          title: copy.title,
          body: copy.body,
          primaryLabel: copy.ctaLabel || 'Get covered',
          primaryHref: copy.ctaHref || hrefs.portal,
          secondaryLabel: copy.secondaryLabel || 'View this site',
          secondaryHref: copy.secondaryHref || hrefs.site,
        },
      };
    default:
      return {
        type: 'EATextSection',
        props: {
          id: blockId('scene', index),
          variant: 'default',
          label: copy.label || '',
          title: copy.title,
          body: copy.body,
          accentValue: '',
          accentCaption: '',
        },
      };
  }
}

/**
 * Map approved Creative Direction + composed scenes → ExperiencePage.puckData.
 * Never emits EAFeatures three-card grids.
 */
export function composePuckDataFromDirector(input: LayoutComposerInput): Data {
  const composed = composeScenesFromDirection(input);
  const brand = input.director.organization.organizationName;
  const hrefs = {
    portal: input.portalLoginHref,
    site: input.sitePath,
  };

  const content = composed.scenes.map((item, index) =>
    emitComposition(item.compositionId, item.scene.copy, index, hrefs),
  );

  return {
    root: {
      props: {
        title: brand,
        compositionSignature: composed.compositionSignature,
        primaryArchetype: input.director.creativeDirection.primaryArchetype,
        ...(input.primaryColor ? { primaryColor: input.primaryColor } : {}),
        ...(input.accentColor ? { accentColor: input.accentColor } : {}),
      },
    },
    content,
    zones: {},
  };
}

export function puckContainsFeatureCards(data: Data): boolean {
  return data.content.some((block) => block.type === 'EAFeatures');
}
