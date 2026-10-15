'use client';

import type { MouseEvent } from 'react';

export default function ClassesAnchor() {
  function scrollToClasses(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById('classes-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#classes-grid');
  }
  return <a href="#classes-grid" onClick={scrollToClasses} data-cta-name="Classes" data-cta-key="classes">Classes</a>;
}
