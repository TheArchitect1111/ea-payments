import { strict as assert } from 'node:assert';
import { optimizeContext } from '../lib/context-optimizer';

const noise = Array.from({ length: 30 }, (_, i) => ({
  id: `noise-${i}`,
  text: `Historical note ${i} about an unrelated portal menu and old deployment state.`,
  source: 'history',
}));

const result = await optimizeContext({
  query: 'video factory render failure local assets narration',
  items: [
    ...noise,
    {
      id: 'render',
      text: 'The Video Factory render fails when remote media URLs disappear. Cache approved visual assets locally before Remotion renders.',
      source: 'video-factory',
      priority: 8,
    },
    {
      id: 'voice',
      text: 'Money Behind It narration should use an edutainment voice with dry humor and mild sarcasm.',
      source: 'creative',
      priority: 5,
    },
  ],
  taskState: {
    goal: 'Make the Video Factory reliable and cheaper to operate.',
    completed: ['Moved media toward local assets'],
    blockers: ['Render pipeline is still fragile'],
    nextAction: 'Use compact relevant context for the repair agent',
    constraints: ['Do not claim completion until verified'],
  },
  maxItems: 4,
  maxChars: 1600,
});

assert.equal(result.selected.length, 4);
assert.equal(result.selected[0]?.id, 'render');
assert.match(result.context, /Video Factory/i);
assert.ok(result.stats.outputChars < result.stats.inputChars, 'optimizer should reduce context size');
assert.ok(result.stats.reductionRatio > 0.5, `expected >50% reduction, got ${result.stats.reductionRatio}`);
console.log(JSON.stringify(result.stats, null, 2));
