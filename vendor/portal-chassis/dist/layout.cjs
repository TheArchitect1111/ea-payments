'use strict';

var jsxRuntime = require('react/jsx-runtime');

// layout/HeaderPortalShell.tsx
function HeaderPortalShell({
  logoSrc,
  nameLine1,
  nameLine2,
  tabs,
  activeTabId,
  logoutApiPath = "/api/portal/login",
  loginPath = "/portal/login",
  showLogout = true
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "header",
      {
        style: {
          background: "var(--portal-header-bg, #0C0C0A)",
          color: "var(--portal-header-text, #fff)",
          borderBottom: "3px solid var(--portal-accent, #C8102E)"
        },
        children: /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { maxWidth: 1200, margin: "0 auto", padding: "16px 20px" }, children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap"
              },
              children: [
                /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "img",
                    {
                      src: logoSrc,
                      alt: "",
                      style: { width: 48, height: 48, objectFit: "contain" }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14 }, children: nameLine1 }),
                    nameLine2 ? /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 800, letterSpacing: "0.04em", fontSize: 14, color: "var(--portal-accent, #C8102E)" }, children: nameLine2 }) : null
                  ] })
                ] }),
                showLogout ? /* @__PURE__ */ jsxRuntime.jsx(
                  "button",
                  {
                    type: "button",
                    "data-portal-logout": "1",
                    style: {
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.35)",
                      color: "inherit",
                      padding: "8px 14px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13
                    },
                    children: "Log Out"
                  }
                ) : null
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "nav",
            {
              "aria-label": "Portal sections",
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16
              },
              children: tabs.map((tab) => /* @__PURE__ */ jsxRuntime.jsx(
                "a",
                {
                  href: tab.href,
                  style: {
                    padding: "8px 14px",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: tab.id === activeTabId ? 700 : 500,
                    color: tab.id === activeTabId ? "#fff" : "rgba(255,255,255,0.75)",
                    background: tab.id === activeTabId ? "var(--portal-accent, #C8102E)" : "rgba(255,255,255,0.08)"
                  },
                  children: tab.label
                },
                tab.id
              ))
            }
          )
        ] })
      }
    ),
    showLogout ? /* @__PURE__ */ jsxRuntime.jsx(
      "script",
      {
        dangerouslySetInnerHTML: {
          __html: `document.querySelector('[data-portal-logout]')?.addEventListener('click',function(){fetch('${logoutApiPath}',{method:'DELETE'}).finally(function(){window.location.href='${loginPath}';});});`
        }
      }
    ) : null
  ] });
}

exports.HeaderPortalShell = HeaderPortalShell;
//# sourceMappingURL=layout.cjs.map
//# sourceMappingURL=layout.cjs.map