import { strict as assert } from 'node:assert';
import { verifyAgentCompletion } from '../lib/agent-reliability/client';
import { nextVideoStage, requiredVideoCompletionGates, type VideoPipelineState } from '../lib/video-factory/pipeline';

const incomplete: VideoPipelineState = {
  projectId: 'wealthy-debt',
  stages: {
    brief: { stage: 'brief', passed: true },
    research: { stage: 'research', passed: true },
    script: { stage: 'script', passed: true },
    'scene-plan': { stage: 'scene-plan', passed: true },
    assets: { stage: 'assets', passed: true },
    narration: { stage: 'narration', passed: true },
    render: { stage: 'render', passed: true },
    qa: { stage: 'qa', passed: false, detail: 'audio not verified' },
  },
};

assert.equal(nextVideoStage(incomplete), 'qa');
const evidence = requiredVideoCompletionGates(incomplete);
const decision = await verifyAgentCompletion({
  taskId: 'wealthy-debt-certification',
  goal: 'Certify Money Behind It episode',
  claimedStatus: 'finished',
  requiredGates: evidence.map((item) => item.name),
  evidence,
});
assert.equal(decision.verified, false);
assert.ok(decision.failed_gates.includes('video:qa'));
assert.ok(decision.failed_gates.includes('video:publish'));

console.log('EA agent reliability contract passed');
