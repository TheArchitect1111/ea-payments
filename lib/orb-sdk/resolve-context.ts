import { resolveGuideContext } from '@/lib/ea-guide';
import { mapGuideAction, mapProduct } from './actions';
import type { OrbContext } from './types';

/** Resolve orb context from a pathname (web router or deep link). */
export function resolveOrbContext(pathname: string): OrbContext {
  const guide = resolveGuideContext(pathname);
  return {
    product: mapProduct(guide.id),
    pathname,
    state: guide.state,
    greeting: guide.greeting,
    focus: guide.focus,
    recommendedAction: guide.recommendedAction,
    actions: guide.actions.map(mapGuideAction),
  };
}
