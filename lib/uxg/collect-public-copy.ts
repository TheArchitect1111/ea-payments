/**
 * Collect public strings from composed puck + portal shell for quality enforcement.
 */
import type { Data } from '@measured/puck';
import type { PublicCopyBundle } from '@/lib/uxg/copy-quality';

function walk(value: unknown, path: string, out: Record<string, string>) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) out[path] = trimmed;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Skip non-copy structural fields.
      if (
        /^(id|type|href|ctaHref|primaryHref|secondaryHref|imageUrl|returnHref|themeId|compositionSignature|factoryConceptId|storyClassification|creativeDirection|websiteSite|grammar|focal|objectPosition|variant|scale|anchorId)$/i.test(
          k,
        )
      ) {
        continue;
      }
      walk(v, path ? `${path}.${k}` : k, out);
    }
  }
}

export function collectPuckPublicCopy(puckData: Data | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!puckData) return out;
  walk(puckData.content, 'website', out);
  return out;
}

export function collectPortalPublicCopy(
  portalShell: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!portalShell) return out;
  walk(portalShell, 'portal', out);
  return out;
}

export function buildPublicCopyBundle(input: {
  puckData?: Data | null;
  portalShell?: Record<string, unknown> | null;
}): PublicCopyBundle {
  const websiteFields = collectPuckPublicCopy(input.puckData);
  const portalFields = collectPortalPublicCopy(input.portalShell);
  return {
    fields: { ...websiteFields, ...portalFields },
    websiteFields,
    portalFields,
  };
}

/**
 * Apply repaired field map back onto portal shell string props (shallow+nested known keys).
 */
export function applyRepairedPortalShell(
  portalShell: Record<string, unknown>,
  repaired: Record<string, string>,
): Record<string, unknown> {
  const next = { ...portalShell };
  for (const [path, value] of Object.entries(repaired)) {
    if (!path.startsWith('portal.')) continue;
    const key = path.slice('portal.'.length);
    if (!key.includes('.') && !key.includes('[')) {
      next[key] = value;
    }
  }
  // Nested member fields
  if (typeof next.memberWhere === 'string' && repaired['portal.memberWhere']) {
    next.memberWhere = repaired['portal.memberWhere'];
  }
  if (typeof next.memberNext === 'string' && repaired['portal.memberNext']) {
    next.memberNext = repaired['portal.memberNext'];
  }
  if (typeof next.purpose === 'string' && repaired['portal.purpose']) {
    next.purpose = repaired['portal.purpose'];
  }
  if (typeof next.brandHeadline === 'string' && repaired['portal.brandHeadline']) {
    next.brandHeadline = repaired['portal.brandHeadline'];
  }
  if (typeof next.brandSubhead === 'string' && repaired['portal.brandSubhead']) {
    next.brandSubhead = repaired['portal.brandSubhead'];
  }
  return next;
}

/**
 * Apply repaired copy onto puck content props by path matching leaf prop names where unique.
 */
export function applyRepairedPuckData(puckData: Data, repaired: Record<string, string>): Data {
  const content = Array.isArray(puckData.content) ? [...puckData.content] : [];
  const nextContent = content.map((block, index) => {
    if (!block || typeof block !== 'object') return block;
    const props = { ...((block as { props?: Record<string, unknown> }).props || {}) };
    const prefix = `website[${index}].props.`;
    for (const [path, value] of Object.entries(repaired)) {
      if (!path.startsWith(prefix)) continue;
      const prop = path.slice(prefix.length);
      if (prop && !prop.includes('.') && !prop.includes('[')) {
        props[prop] = value;
      }
    }
    return { ...block, props };
  });
  return { ...puckData, content: nextContent };
}
