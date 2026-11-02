// EA Bricks - Auto-discovered by chassis
export { AmplifiBrick } from './amplifi'
export { BRICK_QA_CHECKLIST } from './contract'
export type { Brick, BrickInput, BrickOutput } from './contract'

// Registry - this is what chassis reads
import { AmplifiBrick } from './amplifi'

export const BRICKS = {
  amplifi: AmplifiBrick,
  // class: coming next - Step 3
}

export function getBrick(name: string) {
  return BRICKS[name as keyof typeof BRICKS]
}

export function listBricks() {
  return Object.keys(BRICKS)
}
