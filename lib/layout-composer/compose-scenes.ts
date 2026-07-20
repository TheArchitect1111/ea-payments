import { selectCompositionForScene } from './compositions';
import type { ComposedScene, LayoutComposerInput, LayoutComposerResult } from './types';

/**
 * Layout Composer — select a composition template per narrative scene
 * from approved Creative Direction (primary archetype + anti-patterns).
 */
export function composeScenesFromDirection(input: LayoutComposerInput): LayoutComposerResult {
  const { director } = input;
  const primary = director.creativeDirection.primaryArchetype;
  const antiPatterns = director.creativeDirection.antiPatterns;

  const scenes: ComposedScene[] = director.scenes.map((scene) => ({
    role: scene.role,
    compositionId: selectCompositionForScene({
      role: scene.role,
      primaryArchetype: primary,
      antiPatterns,
    }),
    scene,
  }));

  const compositionSignature = scenes.map((s) => `${s.role}:${s.compositionId}`).join('|');

  return {
    scenes,
    creativeDirection: director.creativeDirection,
    compositionSignature,
  };
}
