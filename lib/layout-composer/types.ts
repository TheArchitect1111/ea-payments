import type {
  CreativeDirection,
  NarrativeSceneRole,
  ScenePlanItem,
  StoryArchetype,
  WebsiteDirectorPackage,
} from '@/lib/website-director';

/** Reusable composition template id — maps one scene to one primary Puck composition. */
export type CompositionId =
  | 'human_threshold_bleed'
  | 'human_companion_centered'
  | 'human_craft_detail'
  | 'reality_documentary_stat'
  | 'reality_confrontational'
  | 'mission_plane_full'
  | 'mission_legacy_quiet'
  | 'transform_split_editorial'
  | 'process_sparse_steps'
  | 'proof_trust_statement'
  | 'impact_editorial_figures'
  | 'invitation_belonging'
  | 'invitation_commission'
  | 'invitation_protect';

export type CompositionTemplate = {
  id: CompositionId;
  sceneRole: NarrativeSceneRole;
  label: string;
  /** Archetypes that prefer this composition when available */
  preferredArchetypes: StoryArchetype[];
  /** Never emit feature-card grids */
  forbidsFeatureCards: true;
};

export type ComposedScene = {
  role: NarrativeSceneRole;
  compositionId: CompositionId;
  scene: ScenePlanItem;
};

export type LayoutComposerInput = {
  director: WebsiteDirectorPackage;
  portalLoginHref: string;
  sitePath: string;
  primaryColor?: string;
  accentColor?: string;
};

export type LayoutComposerResult = {
  scenes: ComposedScene[];
  creativeDirection: CreativeDirection;
  compositionSignature: string;
};
