'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type PortalSidebarContextValue = {
  mobileOpen: boolean;
  sidebarExpanded: boolean;
  toggleMobile: () => void;
  toggleSidebar: () => void;
  closeMobile: () => void;
};

const PortalSidebarContext = createContext<PortalSidebarContextValue | null>(null);

export function PortalSidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <PortalSidebarContext.Provider
      value={{
        mobileOpen,
        sidebarExpanded,
        toggleMobile: () => setMobileOpen((v) => !v),
        toggleSidebar: () => setSidebarExpanded((v) => !v),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </PortalSidebarContext.Provider>
  );
}

export function usePortalSidebar() {
  const ctx = useContext(PortalSidebarContext);
  if (!ctx) throw new Error('usePortalSidebar must be used within PortalSidebarProvider');
  return ctx;
}
