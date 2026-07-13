'use client';

import { useEffect, useRef } from 'react';
import { usePortalSidebar } from './PortalSidebarContext';

type Props = {
  firstName?: string;
  pageTitle?: string;
  memberLabel?: string;
};

export function PortalHeader({ firstName, pageTitle = 'Dashboard', memberLabel = 'Portal member' }: Props) {
  const { toggleMobile, toggleSidebar } = usePortalSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const initial = firstName?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="ep-header">
      <div className="ep-header-row">
        <button type="button" className="ep-header-menu" onClick={toggleMobile} aria-label="Toggle menu">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.583 1a.75.75 0 0 1 .75-.75h13.333a.75.75 0 0 1 0 1.5H1.333A.75.75 0 0 1 .583 1Zm0 5a.75.75 0 0 1 .75-.75h6.667a.75.75 0 0 1 0 1.5H1.333A.75.75 0 0 1 .583 6Zm0 5a.75.75 0 0 1 .75-.75h13.333a.75.75 0 0 1 0 1.5H1.333a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" className="ep-header-menu ep-header-menu-desktop" onClick={toggleSidebar} aria-label="Collapse sidebar">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
            <path fillRule="evenodd" clipRule="evenodd" d="M0.583 1a.75.75 0 0 1 .75-.75h13.333a.75.75 0 0 1 0 1.5H1.333A.75.75 0 0 1 .583 1Zm0 5a.75.75 0 0 1 .75-.75h6.667a.75.75 0 0 1 0 1.5H1.333A.75.75 0 0 1 .583 6Zm0 5a.75.75 0 0 1 .75-.75h13.333a.75.75 0 0 1 0 1.5H1.333a.75.75 0 0 1-.75-.75Z" fill="currentColor" />
          </svg>
        </button>
        <h1 className="ep-header-title">{pageTitle}</h1>
      </div>

      <div className="ep-header-tools">
        <div className="ep-header-search">
          <svg className="ep-header-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333Zm5.834-1.667-3.25-3.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input ref={inputRef} type="search" placeholder="Search portal?" className="ep-header-search-input" aria-label="Search portal" />
          <kbd className="ep-header-kbd">? K</kbd>
        </div>

        <div className="ep-header-user">
          <span className="ep-header-avatar" title={firstName}>{initial}</span>
          <div className="ep-header-user-meta">
            <strong>{firstName ?? 'Client'}</strong>
            <span>{memberLabel}</span>
          </div>
        </div>

        <a href="/api/portal/logout" className="ep-header-logout">Sign out</a>
      </div>
    </header>
  );
}
