import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const context: AIRequestContext = {
    requestId: `amplifi_brain_${Date.now()}`,
    actor: { id: 'system:amplifi-brain-run', type: 'system', role: 'production-brain-run' },
    route: '/api/amplifi/brain-run',
    metadata: { target: 'amplifi', mode: 'full-brain', task: 'image-insertion' },
  };

  const result = await runOrchestrator({
    intent: 'run the brain',
    message: `Run the Brain fully for the Amplifi public site image-insertion pass. Preserve the approved slogan: "Focus on your craft. Let Amplifi handle the social media." Use the newly prepared Amplifi visual sprite for the hero, shared social-media burden, four audiences, Smart Search, Idea Box, Smartchitecture, Eva, performance learning, and closing craft scene. Use the previously created Brick & Blade barber campaign showcase for the objective and campaign proof sections. Do not introduce generic replacement imagery. The visual story must run continuously from burden to objective to search to campaign to approval to learning to return-to-craft. Mobile is first-class. Creative Critic must block anything below 8/10 in clarity, differentiation, language quality, visual coherence, proof, or image visibility. Return implementation priorities and identify any visual placement that should block production.`,
    context: {
      project: 'Amplifi',
      route: '/amplifi',
      approvedSlogan: 'Focus on your craft. Let Amplifi handle the social media.',
      visualAssets: ['/amplifi/amplifi-visual-sprite.jpg', '/amplifi/amplifi-barber-showcase.jpg'],
      requiredConcepts: ['common social-media burden', 'barber proof', 'Idea Box', 'Smart Search', 'Eva', 'Smartchitecture', 'approval before publishing', 'performance learning'],
      hardConstraints: ['use approved visuals', 'no generic imagery', 'no missing images', 'guide voice', 'show the process', 'mobile first', 'creative critic may block'],
      acceptance: 'All intended visuals render visibly on desktop and mobile and the story remains coherent.'
    },
    conversationId: 'amplifi-image-insertion-brain-2026-09-09'
  }, context);

  return NextResponse.json(result);
}
