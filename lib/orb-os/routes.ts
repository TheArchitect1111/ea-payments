/**
 * Orb surface → existing Simplifi / portal routes.
 * Shared by GlobalOrb and Orb OS preview — no duplicate path tables.
 */
import type { OrbIntent, OrbSurface } from './intent';

export type ResolveOrbHrefOptions = {
  slug?: string | null;
  /** Opportunity id when intent resolved to a single match */
  opportunityId?: string | null;
  /** Capture draft / note text */
  draft?: string | null;
  /** Ask / search query string */
  query?: string | null;
};

/** Surfaces that should leave the current screen (vs answer in-panel). */
export const ORB_NAVIGABLE_SURFACES: readonly OrbSurface[] = [
  'home',
  'brief',
  'capture',
  'inbox',
  'followups',
  'calendar',
  'settings',
  'portal',
  'classic',
] as const;

export function isNavigableOrbSurface(surface: OrbSurface): boolean {
  return (ORB_NAVIGABLE_SURFACES as readonly string[]).includes(surface);
}

/**
 * Surfaces the Orb can render as a temporary in-place session workspace
 * (over the Brief) instead of a full route navigation.
 */
export const ORB_SESSION_SURFACES: readonly OrbSurface[] = ['inbox'] as const;

export function isOrbSessionSurface(surface: OrbSurface): boolean {
  return (ORB_SESSION_SURFACES as readonly string[]).includes(surface);
}

export function resolveOrbSurfaceHref(
  surface: OrbSurface,
  opts: ResolveOrbHrefOptions = {},
): string | null {
  switch (surface) {
    case 'home':
    case 'brief':
    case 'classic':
      return '/simplifi/workspace';
    case 'capture': {
      const draft = opts.draft?.trim();
      // Capture page seeds from ?url= only today.
      if (draft && /^https?:\/\//i.test(draft)) {
        return `/simplifi/capture?url=${encodeURIComponent(draft.slice(0, 2000))}`;
      }
      return '/simplifi/capture';
    }
    case 'inbox':
      return '/simplifi/inbox';
    case 'followups':
      return '/simplifi/follow-ups';
    case 'calendar':
      return '/simplifi/calendar';
    case 'ask': {
      const q = opts.query?.trim();
      if (q) return `/simplifi/ask?q=${encodeURIComponent(q.slice(0, 200))}`;
      return '/simplifi/ask';
    }
    case 'search': {
      const q = opts.query?.trim();
      if (opts.opportunityId) return `/simplifi/opportunity/${opts.opportunityId}`;
      if (q) return `/simplifi/ask?q=${encodeURIComponent(q.slice(0, 200))}`;
      return '/simplifi/ask';
    }
    case 'settings':
      return '/simplifi/settings';
    case 'portal':
      if (opts.slug) return `/portal/${opts.slug}`;
      return '/portal/login?next=/simplifi/workspace';
    default:
      return null;
  }
}

/**
 * Resolve a navigable href from an interpreted intent.
 * Returns null when the caller should keep answering in-panel (generic ask/search without a destination).
 */
export function resolveOrbIntentHref(
  intent: OrbIntent,
  opts: ResolveOrbHrefOptions = {},
): string | null {
  if (opts.opportunityId) {
    return `/simplifi/opportunity/${opts.opportunityId}`;
  }

  if (!isNavigableOrbSurface(intent.surface)) {
    // search/ask stay in-panel unless opportunityId was provided above
    return null;
  }

  return resolveOrbSurfaceHref(intent.surface, {
    ...opts,
    draft: opts.draft ?? intent.draft,
    query: opts.query ?? intent.query,
  });
}
