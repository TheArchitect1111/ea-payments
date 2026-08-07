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

  const lens = input.conceptLens;
  const scenes: ComposedScene[] = director.scenes.map((scene) => ({
    role: scene.role,
    compositionId: selectCompositionForScene({
      role: scene.role,
      primaryArchetype: primary,
      antiPatterns,
      lens,
    }),
    scene,
  }));

  const bodySig = scenes.map((s) => `${s.role}:${s.compositionId}`).join('|');
  const compositionSignature = lens ? `${lens}|${bodySig}` : bodySig;

  return {
    scenes,
    creativeDirection: director.creativeDirection,
    compositionSignature,
  };
}
