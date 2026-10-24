// This makes Amplifi a brick for EA ecosystem
// Any EA app can call: import { createGrowthCampaign } from './brick.js'
export function createGrowthCampaign({ goal, businessType, businessName }) {
  return {
    brick: "Amplifi",
    version: "1.0-standalone",
    goal,
    businessType,
    campaign: {
      posts: 5,
      templates: ["Customer Win", "Problem Solution", "Behind The Scenes"],
      landingPage: "/free-campaign-preview",
      tracking: "?utm_source=ea-brick"
    },
    standalone: {
      selfMarketing: true,
      backgroundRunner: "lib/runner.js",
      incomeTracker: "lib/tracker/income.js"
    }
  };
}
