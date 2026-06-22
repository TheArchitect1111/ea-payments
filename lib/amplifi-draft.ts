export interface AmplifiSocialDraft {
  linkedIn: string;
  shortCaption: string;
  hashtags: string[];
}

export function buildAmplifiSocialDraft(input: {
  businessName: string;
  considerUrl: string;
  quickWin?: string;
  headline?: string;
}): AmplifiSocialDraft {
  const name = input.businessName.trim() || 'this opportunity';
  const hook =
    input.headline?.trim() ||
    `I came across ${name} and spotted real room to grow visibility and engagement.`;
  const win = input.quickWin?.trim() || 'A clearer story and stronger next step for their audience.';
  const hashtags = ['#Opportunity', '#Growth', '#Amplifi', '#Simplifi'];

  const linkedIn = `${hook}

One quick win worth exploring: ${win}

I put together a complimentary opportunity experience — no pitch, just clarity on what could improve results.

Take a look when you have a moment:
${input.considerUrl}

— Shared via Amplifi™ · Efficiency Architects`;

  const shortCaption = `${name}: ${win} See the full story → ${input.considerUrl}`;

  return { linkedIn, shortCaption, hashtags };
}
