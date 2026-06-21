import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';

var ADMIN_ROLES = ["Officer", "Admin"];
function PortalLayout({
  portalName,
  logoSrc,
  brandColor,
  accentColor,
  navItems,
  adminNavItems = [],
  mobileNavStyle = "bottom",
  children
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const role = user?.publicMetadata?.role;
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const visibleNav = [...navItems, ...isAdmin ? adminNavItems : []];
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
        .pl-root {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
          background-color: var(--color-bg, #0f0f12);
          color: var(--color-text, #f5f5f5);
          font-family: var(--font-body, 'Inter', sans-serif);
        }

        /* \u2500\u2500 Sidebar (desktop) \u2500\u2500 */
        .pl-sidebar {
          width: 240px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--color-surface, #1a1a22);
          border-right: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .pl-sidebar-header {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-6, 24px) var(--space-4, 16px) var(--space-4, 16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .pl-sidebar-logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: var(--radius-sm, 4px);
        }
        .pl-sidebar-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--color-text, #f5f5f5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pl-nav {
          flex: 1;
          padding: var(--space-4, 16px) var(--space-2, 8px);
          display: flex;
          flex-direction: column;
          gap: var(--space-1, 4px);
        }
        .pl-nav-section-label {
          padding: var(--space-3, 12px) var(--space-3, 12px) var(--space-1, 4px);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--color-text-muted, #888);
        }
        .pl-nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
          padding: var(--space-2, 8px) var(--space-3, 12px);
          border-radius: var(--radius-md, 8px);
          text-decoration: none;
          font-size: 0.9rem;
          color: var(--color-text-muted, #888);
          transition: background 0.15s, color 0.15s;
        }
        .pl-nav-link:hover {
          background-color: rgba(255,255,255,0.06);
          color: var(--color-text, #f5f5f5);
        }
        .pl-nav-link.active {
          color: var(--color-text, #f5f5f5);
          font-weight: 600;
        }
        .pl-nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .pl-sidebar-footer {
          padding: var(--space-4, 16px);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: var(--space-3, 12px);
        }
        .pl-user-name {
          font-size: 0.85rem;
          color: var(--color-text, #f5f5f5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* \u2500\u2500 Main content \u2500\u2500 */
        .pl-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .pl-content {
          flex: 1;
          padding: var(--space-8, 32px);
          overflow-y: auto;
        }

        /* \u2500\u2500 Mobile: hamburger header \u2500\u2500 */
        .pl-mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4, 16px);
          background-color: var(--color-surface, #1a1a22);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .pl-mobile-header-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2, 8px);
        }
        .pl-mobile-logo {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }
        .pl-hamburger {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2, 8px);
          color: var(--color-text, #f5f5f5);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pl-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: currentColor;
          border-radius: 2px;
        }

        /* \u2500\u2500 Sheet drawer (mobile) \u2500\u2500 */
        .pl-sheet-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 50;
        }
        .pl-sheet {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background-color: var(--color-surface, #1a1a22);
          z-index: 51;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        /* \u2500\u2500 Bottom nav (mobile) \u2500\u2500 */
        .pl-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface, #1a1a22);
          border-top: 1px solid rgba(255,255,255,0.06);
          z-index: 40;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .pl-bottom-nav-inner {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 56px;
        }
        .pl-bottom-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          font-size: 0.65rem;
          color: var(--color-text-muted, #888);
          padding: var(--space-1, 4px) var(--space-2, 8px);
          flex: 1;
        }
        .pl-bottom-link.active {
          color: var(--color-text, #f5f5f5);
        }
        .pl-bottom-link svg, .pl-bottom-link .pl-nav-icon {
          width: 22px;
          height: 22px;
        }

        @media (max-width: 768px) {
          .pl-sidebar { display: none; }
          .pl-mobile-header { display: flex; }
          .pl-content { padding: var(--space-4, 16px); }
          .pl-bottom-nav-show { display: block; }
          .pl-content-bottom-pad { padding-bottom: 72px; }
        }
        @media (min-width: 769px) {
          .pl-sheet-overlay, .pl-sheet { display: none !important; }
          .pl-bottom-nav { display: none !important; }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "pl-root", children: [
      /* @__PURE__ */ jsxs("aside", { className: "pl-sidebar", style: { "--brand": brandColor }, children: [
        /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-header", children: [
          /* @__PURE__ */ jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "pl-sidebar-logo" }),
          /* @__PURE__ */ jsx("span", { className: "pl-sidebar-name", children: portalName })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "pl-nav", children: [
          navItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
          isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
            adminNavItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-footer", children: [
          /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" }),
          /* @__PURE__ */ jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
        ] })
      ] }),
      mobileNavStyle === "sheet" && sheetOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "pl-sheet-overlay", onClick: () => setSheetOpen(false) }),
        /* @__PURE__ */ jsxs("div", { className: "pl-sheet", children: [
          /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-header", children: [
            /* @__PURE__ */ jsx("img", { src: logoSrc, alt: "", className: "pl-sidebar-logo" }),
            /* @__PURE__ */ jsx("span", { className: "pl-sidebar-name", children: portalName })
          ] }),
          /* @__PURE__ */ jsxs("nav", { className: "pl-nav", onClick: () => setSheetOpen(false), children: [
            navItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href)),
            isAdmin && adminNavItems.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "pl-nav-section-label", children: "Admin" }),
              adminNavItems.map((item) => /* @__PURE__ */ jsx(NavLink, { item, active: isActive(item.href), brandColor }, item.href))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pl-sidebar-footer", children: [
            /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" }),
            /* @__PURE__ */ jsx("span", { className: "pl-user-name", children: user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pl-main", children: [
        /* @__PURE__ */ jsxs("header", { className: "pl-mobile-header", children: [
          /* @__PURE__ */ jsxs("div", { className: "pl-mobile-header-brand", children: [
            /* @__PURE__ */ jsx("img", { src: logoSrc, alt: "", className: "pl-mobile-logo" }),
            /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, fontSize: "0.9rem" }, children: portalName })
          ] }),
          mobileNavStyle === "sheet" && /* @__PURE__ */ jsxs("button", { className: "pl-hamburger", onClick: () => setSheetOpen(true), "aria-label": "Open menu", children: [
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", {})
          ] }),
          /* @__PURE__ */ jsx(UserButton, { afterSignOutUrl: "/login" })
        ] }),
        /* @__PURE__ */ jsx("main", { className: `pl-content${mobileNavStyle === "bottom" ? " pl-content-bottom-pad" : ""}`, children })
      ] }),
      mobileNavStyle === "bottom" && /* @__PURE__ */ jsx("nav", { className: "pl-bottom-nav pl-bottom-nav-show", children: /* @__PURE__ */ jsx("div", { className: "pl-bottom-nav-inner", children: visibleNav.slice(0, 5).map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            href: item.href,
            className: `pl-bottom-link${isActive(item.href) ? " active" : ""}`,
            style: isActive(item.href) ? { color: brandColor } : void 0,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "pl-nav-icon" }),
              /* @__PURE__ */ jsx("span", { children: item.label })
            ]
          },
          item.href
        );
      }) }) })
    ] })
  ] });
}
function NavLink({
  item,
  active,
  brandColor
}) {
  const Icon = item.icon;
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href: item.href,
      className: `pl-nav-link${active ? " active" : ""}`,
      style: active ? { backgroundColor: `${brandColor}22`, color: brandColor } : void 0,
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "pl-nav-icon" }),
        item.label
      ]
    }
  );
}

export { PortalLayout };
//# sourceMappingURL=portal-layout.js.map
//# sourceMappingURL=portal-layout.js.map