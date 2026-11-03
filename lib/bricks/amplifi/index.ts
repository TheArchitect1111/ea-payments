import { Brick, BrickInput, BrickOutput, BRICK_QA_CHECKLIST } from '../contract'

// This wraps your existing amplifi-standalone brick.js
export const AmplifiBrick: Brick = {
  name: "Amplifi",
  version: "1.0-contract-v1",
  
  guide: {
    understand: "What do you need? Fill empty chairs?",
    guide: "I checked 6 open chairs Tuesday, I remember you don't discount",
    solve: "I made 2 posts, tap Yes, I post at 6pm, track $160 revenue"
  },
  
  pricing: {
    starter: 49,
    growth: 99,
    operator: 199
  },
  
  qa: BRICK_QA_CHECKLIST,
  
  create: async (input: BrickInput): Promise<BrickOutput> => {
    // For now, calls your standalone logic
    // Later: import { createGrowthCampaign } from ~/amplifi-standalone/lib/brick.js
    const goal = input.goal || "Fill empty chairs"
    const owner = input.owner
    
    return {
      campaign: {
        goal,
        owner,
        businessType: input.businessType || "barbershop",
        posts: 5,
        template: "Behind The Scenes / Customer Win / Problem Solution",
        status: "queued"
      },
      links: [
        `/free-campaign-preview?utm_source=amplifi-${owner}`,
      ],
      revenueTracked: true
    }
  }
}

export default AmplifiBrick
