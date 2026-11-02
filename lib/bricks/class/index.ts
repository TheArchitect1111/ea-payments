import { Brick, BrickInput, BrickOutput, BRICK_QA_CHECKLIST } from '../contract'

export interface ClassBrickInput extends BrickInput {
  classes: number
  payment: "Square" | "Stripe"
  workflow: "direct-vs-waitlist"
  catalogId?: string
}

export const ClassBrick: Brick = {
  name: "Class",
  version: "1.0-from-amanda-portable",
  
  guide: {
    understand: "How many classes? What's ready to sell?",
    guide: "I checked 12 classes, 8 available for direct registration, 4 waitlist, Square checkout",
    solve: "Tap Yes, I create checkout links, enroll students, send welcome + what to bring"
  },
  
  pricing: {
    starter: 99,
    growth: 199,
    operator: 399
  },
  
  qa: BRICK_QA_CHECKLIST,
  
  create: async (input: ClassBrickInput): Promise<BrickOutput> => {
    const classes = input.classes || 12
    const payment = input.payment || "Square"
    const workflow = input.workflow || "direct-vs-waitlist"
    
    // This is your Amanda logic made reusable:
    // - available = direct path to registration
    // - not ready = waitlist, no competing buttons
    return {
      campaign: {
        owner: input.owner,
        classes,
        payment,
        workflow,
        modules: [
          "Catalog",      // list classes
          "Menu",          // direct vs waitlist selection
          "Checkout",      // Square
          "Entitlement",   // unlock portal
          "Welcome",       // confirmation page
          "Email",         // welcome + what to bring
          "Training Hub",  // classroom
          "Billing"        // history
        ],
        logic: {
          available: "direct → Square checkout → enrollment → portal",
          notReady: "waitlist → capture → notify when ready"
        }
      },
      links: [
        `/portal/${input.owner.toLowerCase()}/classes`,
        `/portal/${input.owner.toLowerCase()}/checkout`,
        `/portal/${input.owner.toLowerCase()}/welcome`
      ],
      revenueTracked: true
    }
  }
}

export default ClassBrick

// Helper to create Amanda instance from brick
export function createAmandaFromBrick() {
  return ClassBrick.create({
    owner: "Amanda",
    goal: "Launch 12 classes with direct registration",
    classes: 12,
    payment: "Square",
    workflow: "direct-vs-waitlist",
    businessType: "wellness"
  })
}
