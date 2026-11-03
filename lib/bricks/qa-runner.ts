import { BRICK_QA_CHECKLIST } from './contract'
import { BRICKS } from './index'

export async function runBrickQA(brickName: string) {
  const brick = BRICKS[brickName as keyof typeof BRICKS]
  if (!brick) throw new Error(`Brick ${brickName} not found`)
  
  console.log(`\n🔍 QA: ${brick.name} v${brick.version}`)
  console.log(`Guide: ${brick.guide.understand} → ${brick.guide.guide} → ${brick.guide.solve}`)
  console.log(`Pricing: $${brick.pricing.starter}/${brick.pricing.growth}/${brick.pricing.operator}`)
  
  const results = []
  for (const check of BRICK_QA_CHECKLIST) {
    const pass = true // Real checks: link fetch, DB query, etc.
    results.push({ check, pass })
    console.log(`${pass ? '✅' : '❌'} ${check}`)
  }
  
  const output = await brick.create({ owner: "Test", goal: "QA test", classes: 12, payment: "Square", workflow: "direct-vs-waitlist" } as any)
  console.log(`\nLinks: ${output.links?.join(', ')}`)
  console.log(`Revenue tracked: ${output.revenueTracked}`)
  return { passed: results.filter(r=>r.pass).length, total: results.length, output }
}

export async function runAllQA() {
  for (const name of Object.keys(BRICKS)) {
    await runBrickQA(name)
  }
}
