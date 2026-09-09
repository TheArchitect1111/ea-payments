import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const context: AIRequestContext = {
    requestId: `amplifi_image_brain_${Date.now()}`,
    actor: { id: 'system:amplifi-image-brain', type: 'system', role: 'production-brain-run' },
    route: '/api/amplifi/brain-run',
    metadata: { target: 'amplifi', mode: 'full-brain-image-integration' },
  };

  const result = await runOrchestrator({
    intent: 'run the brain',
    message: `Run the full EA Creative Brain for the Amplifi public site image-integration pass. Preserve the approved slogan: "Focus on your craft. Let Amplifi handle the social media." The user has approved a new visual storyboard plus the previously created Brick & Blade barbershop campaign visuals. Your job is to produce exact production guidance for integrating these visuals into the existing Amplifi page. The page must tell one continuous story: social media steals attention -> the user gives Amplifi an objective or raw idea -> Amplifi searches for timely context -> builds a coordinated campaign -> shows the real Brick & Blade campaign proof -> Eva guides review and approval -> Amplifi learns -> the user returns to their craft. Replace generic current imagery. Use the new images for hero, shared problem, audience recognition, search, Idea Box, Smartchitecture process, Eva, performance/learning, and closing. Use the existing Brick & Blade barbershop campaign images as the real proof thread in the objective/campaign/approval portions. Every image must have a job. No decorative stock imagery. Make the process visual and guided. Eva must feel premium and specific, not like a generic chatbot. Mobile must be first-class. Creative Critic must reject output below 8/10 for clarity, visual coherence, differentiation, proof, or guided language. Return exact placement priorities and any warnings about overusing text inside images.`,
    context: {
      project: 'Amplifi',
      route: '/amplifi',
      approvedSlogan: 'Focus on your craft. Let Amplifi handle the social media.',
      visualAssets: ['new Amplifi visual storyboard', 'Brick & Blade barbershop campaign showcase'],
      requiredPlacements: ['hero', 'shared problem', 'audiences', 'smart search', 'campaign proof', 'Idea Box', 'Smartchitecture', 'Eva', 'performance learning', 'closing'],
      hardConstraints: ['replace generic imagery', 'use barber campaign as proof thread', 'guided language', 'premium not generic', 'visual process', 'mobile first', 'approval before publishing'],
      acceptance: 'A first-time visitor should understand Amplifi visually without needing the creator to explain it.'
    },
    conversationId: 'amplifi-image-integration-2026-09-09'
  }, context);

  return NextResponse.json(result);
}
