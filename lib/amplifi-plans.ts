export type AmplifiPlanId = 'starter' | 'social' | 'intelligence' | 'complete';

export type AmplifiPlan = {
  id: AmplifiPlanId;
  name: string;
  monthlyPrice: number;
  description: string;
  limits: {
    postsPerMonth: number | null;
    seriesPerMonth: number | null;
    campaignsPerMonth: number | null;
    watchedSubjects: number;
  };
  capabilities: {
    post: boolean;
    series: boolean;
    campaign: boolean;
    graphics: boolean;
    shortVideo: boolean;
    research: boolean;
    continuousMonitoring: boolean;
    multiChannelPlanning: boolean;
    emailAndBlog: boolean;
    smartchitecture: boolean;
    publishing: boolean;
  };
};

export const AMPLIFI_PLANS: Record<AmplifiPlanId, AmplifiPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    description: 'Experience Amplifi and create a limited set of finished content before committing to a paid plan.',
    limits: { postsPerMonth: 3, seriesPerMonth: 0, campaignsPerMonth: 1, watchedSubjects: 0 },
    capabilities: { post: true, series: false, campaign: true, graphics: true, shortVideo: false, research: false, continuousMonitoring: false, multiChannelPlanning: false, emailAndBlog: false, smartchitecture: true, publishing: false },
  },
  social: {
    id: 'social',
    name: 'Social',
    monthlyPrice: 29,
    description: 'Turn what is already happening in your business into polished posts, series, graphics and campaigns.',
    limits: { postsPerMonth: 30, seriesPerMonth: 4, campaignsPerMonth: 4, watchedSubjects: 0 },
    capabilities: { post: true, series: true, campaign: true, graphics: true, shortVideo: true, research: false, continuousMonitoring: false, multiChannelPlanning: true, emailAndBlog: false, smartchitecture: true, publishing: true },
  },
  intelligence: {
    id: 'intelligence',
    name: 'Intelligence',
    monthlyPrice: 59,
    description: 'Add research and opportunity monitoring so Amplifi can find timely reasons to communicate, not just wait for prompts.',
    limits: { postsPerMonth: 60, seriesPerMonth: 8, campaignsPerMonth: 8, watchedSubjects: 3 },
    capabilities: { post: true, series: true, campaign: true, graphics: true, shortVideo: true, research: true, continuousMonitoring: true, multiChannelPlanning: true, emailAndBlog: false, smartchitecture: true, publishing: true },
  },
  complete: {
    id: 'complete',
    name: 'Complete',
    monthlyPrice: 129,
    description: 'Run the complete content operation across research, creative, campaigns, approvals, publishing and learning.',
    limits: { postsPerMonth: null, seriesPerMonth: null, campaignsPerMonth: null, watchedSubjects: 10 },
    capabilities: { post: true, series: true, campaign: true, graphics: true, shortVideo: true, research: true, continuousMonitoring: true, multiChannelPlanning: true, emailAndBlog: true, smartchitecture: true, publishing: true },
  },
};

export const AMPLIFI_PLAN_ORDER: AmplifiPlanId[] = ['starter', 'social', 'intelligence', 'complete'];

export function getAmplifiPlan(plan?: string | null): AmplifiPlan {
  const id = String(plan || '').toLowerCase() as AmplifiPlanId;
  return AMPLIFI_PLANS[id] || AMPLIFI_PLANS.starter;
}

export function amplifiPlanAllows(plan: AmplifiPlanId, capability: keyof AmplifiPlan['capabilities']) {
  return AMPLIFI_PLANS[plan].capabilities[capability];
}
