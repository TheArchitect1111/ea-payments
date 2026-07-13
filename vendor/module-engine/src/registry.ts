import {
  CAPABILITY_CATALOG,
  getCapabilityManifest,
  type CapabilityManifest,
} from '@ea/capability-registry';
import type { CapabilityContribution } from './types';

/**
 * In-memory capability registry.
 * Workspace Engine asks: what is enabled? → contributions are assembled from manifests.
 */
export class CapabilityRegistry {
  private manifests = new Map<string, CapabilityManifest>();

  constructor(seed: CapabilityManifest[] = CAPABILITY_CATALOG) {
    for (const manifest of seed) {
      this.register(manifest);
    }
  }

  register(manifest: CapabilityManifest): void {
    if (!manifest.id) {
      throw new Error('CapabilityManifest.id is required');
    }
    this.manifests.set(manifest.id, manifest);
  }

  registerMany(manifests: CapabilityManifest[]): void {
    for (const manifest of manifests) this.register(manifest);
  }

  get(id: string): CapabilityManifest | undefined {
    return this.manifests.get(id) ?? getCapabilityManifest(id);
  }

  has(id: string): boolean {
    return this.manifests.has(id);
  }

  list(): CapabilityManifest[] {
    return [...this.manifests.values()];
  }

  listByCategory(category: CapabilityManifest['category']): CapabilityManifest[] {
    return this.list().filter((m) => m.category === category);
  }

  listCertified(): CapabilityManifest[] {
    return this.list().filter((m) => m.certified && m.status === 'Certified');
  }

  /** Marketplace-oriented snapshot. */
  marketplaceEntries(): Array<{
    id: string;
    name: string;
    status: CapabilityManifest['status'];
    version: string;
    category: CapabilityManifest['category'];
    consumers: string[];
    dependencies: string[];
    certified: boolean;
    documentation?: string;
  }> {
    return this.list().map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      version: m.version,
      category: m.category,
      consumers: m.consumers,
      dependencies: m.dependencies,
      certified: m.certified,
      documentation: m.documentation,
    }));
  }

  contributionFor(id: string): CapabilityContribution | undefined {
    const m = this.get(id);
    if (!m) return undefined;
    return {
      capabilityId: m.id,
      navigation: m.navigation ?? [],
      routes: m.routes,
      widgets: m.widgets,
      dashboardCards: m.dashboardCards ?? [],
      permissions: m.permissions,
      aiSkills: m.aiSkills,
      featureFlags: m.featureFlags ?? [],
    };
  }
}

let defaultRegistry: CapabilityRegistry | undefined;

export function getDefaultRegistry(): CapabilityRegistry {
  if (!defaultRegistry) defaultRegistry = new CapabilityRegistry();
  return defaultRegistry;
}

export function resetDefaultRegistry(): void {
  defaultRegistry = undefined;
}
