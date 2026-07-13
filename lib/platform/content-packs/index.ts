import { bobRumballLearningContentPack } from './bob-rumball';
import { cprAthleticsContentPack } from './cpr';
import { eaPlatformContentPack } from './ea';
import { etfmCoachingContentPack } from './etfm';
import { threeHcReadinessContentPack } from './threehc';
import type { VerticalContentPack } from './types';

const PACKS: VerticalContentPack[] = [
  eaPlatformContentPack,
  cprAthleticsContentPack,
  etfmCoachingContentPack,
  threeHcReadinessContentPack,
  bobRumballLearningContentPack,
];

const byClientId = new Map<string, VerticalContentPack>(
  PACKS.map((p) => [p.platformClientId, p]),
);
const byId = new Map<string, VerticalContentPack>(PACKS.map((p) => [p.id, p]));

export function listContentPacks(): VerticalContentPack[] {
  return [...PACKS];
}

export function getContentPackForClient(
  platformClientId: string,
): VerticalContentPack | undefined {
  return byClientId.get(platformClientId);
}

export function getContentPackById(id: string): VerticalContentPack | undefined {
  return byId.get(id);
}

export function listContentPackSummaries() {
  return PACKS.map((p) => ({
    id: p.id,
    platformClientId: p.platformClientId,
    vertical: p.vertical,
    label: p.label,
    summary: p.summary,
  }));
}

export type { VerticalContentPack, ContentPackContext, VerticalContentPackId } from './types';
export { cprAthleticsContentPack } from './cpr';
export { CPR_ASSETS } from './cpr-assets';
export {
  getCprPortalModuleCopy,
  isCprPortalClient,
  CPR_PORTAL_RESOURCES,
  CPR_PORTAL_EVENTS,
} from './cpr-portal';
export type { PortalModuleCopyKey, PortalModuleCopy } from './cpr-portal';
export { eaPlatformContentPack } from './ea';
export { etfmCoachingContentPack } from './etfm';
export { threeHcReadinessContentPack } from './threehc';
export { bobRumballLearningContentPack } from './bob-rumball';
