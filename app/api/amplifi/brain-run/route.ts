import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const context: AIRequestContext = {
    requestId: `amplifi_brain_${Date.now()}`,
    actor: { id: 'system:amplifi-brain-run', type: 'system', role: 'production-brain-run' },
    route: '/api/amplifi/brain-run',
    metadata: { target: 'amplifi', mode: 'full-brain' },
  };

  const result = await runOrchestrator({
    intent: 'run the brain',
    message: `Run the Brain fully for the Amplifi public site and produce a production-ready creative directive for the next implementation pass. Preserve the approved slogan: "Focus on your craft. Let Amplifi handle the social media." Preserve the product truth: Amplifi helps with social media posting by taking a user's objective or raw idea, searching for relevant timely context, building coordinated social campaigns, creating posts and visuals, organizing them for approval, and letting Eva guide the user through what was found, what was built, why it matters, and what happens next. Include the Idea Box as a core concept. The visitor must immediately understand the common pain across business owners, creators/influencers, organization leaders, and athletes/professionals: social media constantly demands time, ideas, relevance, visuals, posting cadence, and follow-up. The current live page is unacceptable because imagery has been missing or generic, Eva looks generic, some language is unclear and not guided, Smartchitecture/process explanations are not visual enough, and previous implementations looked like generic SaaS sections instead of a premium guided experience. Create one coherent premium visual direction. Make the process visual. Give Eva a premium, unmistakable identity and presence. Use emotional human imagery where recognition matters and product UI where proof matters. Avoid repetitive imagery. Avoid generic SaaS jargon. Demonstrate the system instead of describing it. Mobile must be first-class. Creative Critic must block anything below 8/10 in clarity, differentiation, language quality, visual coherence, or proof. Return exact implementation priorities for the Amplifi page, including what to remove, what to keep, what to rewrite, what to visualize, and what should appear above the fold.`,
    context: {
      project: 'Amplifi',
      route: '/amplifi',
      approvedSlogan: 'Focus on your craft. Let Amplifi handle the social media.',
      requiredConcepts: ['common social-media burden', 'Idea Box', 'search and build', 'guided language', 'Eva', 'Smartchitecture', 'visual process', 'approval before publishing'],
      hardConstraints: ['premium not generic', 'real visual storytelling', 'no repetitive imagery', 'guide voice', 'show the process', 'mobile first', 'creative critic may block'],
      acceptance: 'A first-time visitor should understand what Amplifi does, why it is different, and how it works without explanation from the creator.'
    },
    conversationId: 'amplifi-production-brain-run-2026-09-09b'
  }, context);

  return NextResponse.json(result);
}
