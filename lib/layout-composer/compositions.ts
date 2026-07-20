import { STORY_ARCHETYPES, type NarrativeSceneRole } from '@/lib/website-director';
import type { CompositionId, CompositionTemplate } from './types';

export const COMPOSITION_TEMPLATES: CompositionTemplate[] = [
  {
    id: 'human_threshold_bleed',
    sceneRole: 'human_story',
    label: 'Full-bleed threshold + brand line',
    preferredArchetypes: [
      'The Community Builder',
      'The Advocate',
      'The Challenger',
      'The Caregiver',
    ],
    forbidsFeatureCards: true,
  },
  {
    id: 'human_companion_centered',
    sceneRole: 'human_story',
    label: 'Companion-centered opening',
    preferredArchetypes: ['The Guide', 'The Educator', 'The Protector'],
    forbidsFeatureCards: true,
  },
  {
    id: 'human_craft_detail',
    sceneRole: 'human_story',
    label: 'Craft / material detail opening',
    preferredArchetypes: ['The Craftsman', 'The Restorer', 'The Legacy Organization', 'The Builder'],
    forbidsFeatureCards: true,
  },
  {
    id: 'reality_documentary_stat',
    sceneRole: 'current_reality',
    label: 'Documentary type + stark beat',
    preferredArchetypes: ['The Advocate', 'The Community Builder', 'The Restorer', 'The Caregiver'],
    forbidsFeatureCards: true,
  },
  {
    id: 'reality_confrontational',
    sceneRole: 'current_reality',
    label: 'Confrontational stakes plane',
    preferredArchetypes: ['The Challenger', 'The Innovator'],
    forbidsFeatureCards: true,
  },
  {
    id: 'mission_plane_full',
    sceneRole: 'mission',
    label: 'Full-width mission plane',
    preferredArchetypes: [
      'The Community Builder',
      'The Advocate',
      'The Guide',
      'The Builder',
      'The Innovator',
      'The Educator',
    ],
    forbidsFeatureCards: true,
  },
  {
    id: 'mission_legacy_quiet',
    sceneRole: 'mission',
    label: 'Quiet heritage mission',
    preferredArchetypes: ['The Legacy Organization', 'The Restorer', 'The Craftsman', 'The Protector'],
    forbidsFeatureCards: true,
  },
  {
    id: 'transform_split_editorial',
    sceneRole: 'transformation',
    label: 'Two-voice before → after editorial',
    preferredArchetypes: [...STORY_ARCHETYPES],
    forbidsFeatureCards: true,
  },
  {
    id: 'process_sparse_steps',
    sceneRole: 'process',
    label: 'Sparse process steps — not feature cards',
    preferredArchetypes: ['The Builder', 'The Educator', 'The Craftsman', 'The Guide'],
    forbidsFeatureCards: true,
  },
  {
    id: 'proof_trust_statement',
    sceneRole: 'proof',
    label: 'Trust statement without logo cloud',
    preferredArchetypes: ['The Protector', 'The Legacy Organization', 'The Craftsman'],
    forbidsFeatureCards: true,
  },
  {
    id: 'impact_editorial_figures',
    sceneRole: 'impact',
    label: 'Sparse editorial outcome figures',
    preferredArchetypes: ['The Community Builder', 'The Advocate', 'The Builder', 'The Innovator'],
    forbidsFeatureCards: true,
  },
  {
    id: 'invitation_belonging',
    sceneRole: 'invitation',
    label: 'Belonging invitation',
    preferredArchetypes: [
      'The Community Builder',
      'The Advocate',
      'The Guide',
      'The Caregiver',
      'The Educator',
    ],
    forbidsFeatureCards: true,
  },
  {
    id: 'invitation_commission',
    sceneRole: 'invitation',
    label: 'Commission / view the work',
    preferredArchetypes: ['The Craftsman', 'The Builder', 'The Restorer', 'The Legacy Organization'],
    forbidsFeatureCards: true,
  },
  {
    id: 'invitation_protect',
    sceneRole: 'invitation',
    label: 'Protect / secure ask',
    preferredArchetypes: ['The Protector'],
    forbidsFeatureCards: true,
  },
];

const DEFAULT_BY_ROLE: Partial<Record<NarrativeSceneRole, CompositionId>> = {
  human_story: 'human_companion_centered',
  current_reality: 'reality_documentary_stat',
  mission: 'mission_plane_full',
  transformation: 'transform_split_editorial',
  process: 'process_sparse_steps',
  proof: 'proof_trust_statement',
  impact: 'impact_editorial_figures',
  invitation: 'invitation_belonging',
  portal_glimpse: 'invitation_belonging',
};

export function selectCompositionForScene(input: {
  role: NarrativeSceneRole;
  primaryArchetype: StoryArchetype;
  antiPatterns: string[];
}): CompositionId {
  const candidates = COMPOSITION_TEMPLATES.filter((t) => t.sceneRole === input.role);
  if (candidates.length === 0) {
    return DEFAULT_BY_ROLE[input.role] || 'mission_plane_full';
  }

  const preferred = candidates.find((t) =>
    t.preferredArchetypes.includes(input.primaryArchetype),
  );
  if (preferred) return preferred.id;

  return candidates[0]?.id || DEFAULT_BY_ROLE[input.role] || 'mission_plane_full';
}
