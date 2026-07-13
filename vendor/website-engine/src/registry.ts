import type { WebsiteSectionDefinition, WebsiteSectionKind } from './types';
import { LANDING_CHASSIS_SECTIONS } from './landing-map';
import {
  EXPERIENCE_BUILDER_SEED_SECTIONS,
  adaptExperienceBlocks,
  type ExperienceBlockInput,
} from './puck-map';

export class WebsiteSectionRegistry {
  private sections = new Map<string, WebsiteSectionDefinition>();

  constructor(seed: WebsiteSectionDefinition[] = []) {
    for (const section of seed) this.register(section);
  }

  register(section: WebsiteSectionDefinition): void {
    this.sections.set(section.id, section);
  }

  registerMany(list: WebsiteSectionDefinition[]): void {
    for (const section of list) this.register(section);
  }

  get(id: string): WebsiteSectionDefinition | undefined {
    return this.sections.get(id);
  }

  list(): WebsiteSectionDefinition[] {
    return [...this.sections.values()];
  }

  listByKind(kind: WebsiteSectionKind): WebsiteSectionDefinition[] {
    return this.list().filter((s) => s.kind === kind);
  }

  listBySource(source: WebsiteSectionDefinition['source']): WebsiteSectionDefinition[] {
    return this.list().filter((s) => s.source === source);
  }
}

/** Default registry: landing chassis + experience-builder seed (or live blocks). */
export function createDefaultWebsiteRegistry(
  experienceBlocks?: ExperienceBlockInput[],
): WebsiteSectionRegistry {
  const registry = new WebsiteSectionRegistry();
  registry.registerMany(LANDING_CHASSIS_SECTIONS);
  registry.registerMany(
    experienceBlocks?.length
      ? adaptExperienceBlocks(experienceBlocks)
      : EXPERIENCE_BUILDER_SEED_SECTIONS,
  );
  return registry;
}

let defaultRegistry: WebsiteSectionRegistry | undefined;

export function getDefaultWebsiteRegistry(): WebsiteSectionRegistry {
  if (!defaultRegistry) defaultRegistry = createDefaultWebsiteRegistry();
  return defaultRegistry;
}

export function resetDefaultWebsiteRegistry(): void {
  defaultRegistry = undefined;
}
