'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type PortalChromeContextValue = {
  brandName?: string;
  workspaceName?: string;
  personalityName?: string;
  memberLabel?: string;
  homeLabel?: string;
  personalityId?: string;
};

const PortalChromeContext = createContext<PortalChromeContextValue>({});

export function PortalChromeProvider({
  value,
  children,
}: {
  value: PortalChromeContextValue;
  children: ReactNode;
}) {
  return <PortalChromeContext.Provider value={value}>{children}</PortalChromeContext.Provider>;
}

export function usePortalChrome() {
  return useContext(PortalChromeContext);
}

/** Compact workspace identity strip for module pages inside PortalShell. */
export function PortalModuleChromeStrip() {
  const chrome = usePortalChrome();
  if (!chrome.brandName && !chrome.workspaceName) return null;

  return (
    <div className="ep-module-chrome">
      {chrome.brandName ? (
        <p className="ep-module-chrome-brand">{chrome.brandName}</p>
      ) : null}
      <p className="ep-module-chrome-meta">
        {[chrome.workspaceName, chrome.personalityName || chrome.personalityId, chrome.memberLabel]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </div>
  );
}
