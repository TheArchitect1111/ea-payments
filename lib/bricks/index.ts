// EA Bricks - Auto-discovered by chassis
export { AmplifiBrick } from './amplifi'
export { ClassBrick, createAmandaFromBrick } from './class'
export { BRICK_QA_CHECKLIST } from './contract'
export type { Brick, BrickInput, BrickOutput } from './contract'

import { AmplifiBrick } from './amplifi'
import { ClassBrick } from './class'

export const BRICKS = {
  amplifi: AmplifiBrick,
  class: ClassBrick,
}

export function getBrick(name: string) {
  return BRICKS[name as keyof typeof BRICKS]
}

export function listBricks() {
  return Object.keys(BRICKS)
}

export function createBrickInstance(name: string, input: any) {
  const brick = getBrick(name)
  if (!brick) throw new Error(`Brick ${name} not found`)
  return brick.create(input)
}
