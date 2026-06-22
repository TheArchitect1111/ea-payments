export interface StoryFormats {
  linkedIn: string;
  email: string;
  sms: string;
  shortCaption: string;
  hashtags: string[];
}

export interface StoryInput {
  businessName: string;
  considerUrl: string;
  quickWin?: string;
  headline?: string;
  prospectName?: string;
}

export function buildStoryFormats(input: StoryInput): StoryFormats {
  const name = input.businessName.trim() || 'this opportunity';
  const prospect = input.prospectName?.trim();
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

  const email = `Subject: A complimentary opportunity review for ${name}

Hi${prospect ? ` ${prospect}` : ''},

While reviewing ${name}, I noticed a few opportunities that could improve visibility, engagement, and results.

I created a short, complimentary experience that highlights what's working, where opportunities may exist, and practical next steps:

${input.considerUrl}

One quick win worth exploring: ${win}

No purchase required — just clarity you can use right away.

Best,
Efficiency Architects`;

  const sms = `${name}: spotted a strong opportunity (${win.slice(0, 60)}…). Quick review → ${input.considerUrl}`;

  const shortCaption = `${name}: ${win} See the full story → ${input.considerUrl}`;

  return { linkedIn, email, sms, shortCaption, hashtags };
}

/** @deprecated Use buildStoryFormats — kept for Amplifi draft compat */
export function buildAmplifiSocialDraft(input: StoryInput) {
  const formats = buildStoryFormats(input);
  return {
    linkedIn: formats.linkedIn,
    shortCaption: formats.shortCaption,
    hashtags: formats.hashtags,
    email: formats.email,
    sms: formats.sms,
  };
}
