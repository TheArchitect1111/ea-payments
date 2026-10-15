'use client';

import type { MouseEvent } from 'react';

export default function ClassesAnchor({ target = 'classes-grid' }: { target?: 'classes-grid' | 'classes' }) {
  function scrollToClasses(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + target);
  }
  return <a href={'#' + target} onClick={scrollToClasses} data-cta-name="Classes" data-cta-key="classes">Classes</a>;
}
