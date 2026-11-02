// EA Brick Contract - v1 - One plug for all bricks
export interface BrickInput {
  owner: string
  goal: string
  businessType?: string
}

export interface BrickOutput {
  campaign?: any
  links?: string[]
  revenueTracked?: boolean
}

export interface Brick {
  name: string
  version: string
  create: (input: BrickInput) => Promise<BrickOutput> | BrickOutput
  guide: {
    understand: string
    guide: string
    solve: string
  }
  pricing: {
    starter: number
    growth: number
    operator: number
  }
  qa: string[]
}

export const BRICK_QA_CHECKLIST = [
  "link opens",
  "checkout test $1",
  "enrollment in DB",
  "portal access",
  "welcome email"
]
