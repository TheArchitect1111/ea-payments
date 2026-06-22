import type { SimplifiObject } from './simplifi-objects';

export interface RelationshipCluster {
  id: string;
  label: string;
  domain?: string;
  objectIds: string[];
  hint: string;
}

function domainFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return undefined;
  }
}

export function buildRelationshipClusters(objects: SimplifiObject[]): RelationshipCluster[] {
  const byDomain = new Map<string, SimplifiObject[]>();

  for (const obj of objects) {
    const domain = domainFromUrl(obj.sourceUrl);
    if (!domain) continue;
    const list = byDomain.get(domain) ?? [];
    list.push(obj);
    byDomain.set(domain, list);
  }

  const clusters: RelationshipCluster[] = [];

  for (const [domain, group] of byDomain) {
    if (group.length < 2) continue;
    clusters.push({
      id: `domain-${domain}`,
      label: domain,
      domain,
      objectIds: group.map((o) => o.id),
      hint: `${group.length} captures from the same source — consider combining into one pursuit.`,
    });
  }

  const byPurpose = new Map<string, SimplifiObject[]>();
  for (const obj of objects) {
    if (!obj.savePurpose) continue;
    const key = obj.savePurpose.toLowerCase();
    const list = byPurpose.get(key) ?? [];
    list.push(obj);
    byPurpose.set(key, list);
  }

  for (const [purpose, group] of byPurpose) {
    if (group.length < 2) continue;
    clusters.push({
      id: `purpose-${purpose.replace(/\s+/g, '-')}`,
      label: purpose,
      objectIds: group.map((o) => o.id),
      hint: `${group.length} items share purpose "${purpose}" — batch your next actions.`,
    });
  }

  return clusters.slice(0, 5);
}
