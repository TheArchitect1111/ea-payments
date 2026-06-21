import { SignIn, SignUp } from '@clerk/nextjs';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';

function ClerkShell({ brandColor, logoSrc, portalName, tagline, mode }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
        .cs-root {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
        }
        .cs-left {
          flex: 0 0 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-12, 48px) var(--space-8, 32px);
          gap: var(--space-6, 24px);
        }
        .cs-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .cs-portal-name {
          margin: 0;
          color: #ffffff;
          font-family: var(--font-display, 'Inter', sans-serif);
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
        }
        .cs-tagline {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 1rem;
          text-align: center;
          max-width: 320px;
          line-height: 1.5;
        }
        .cs-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg, #ffffff);
          padding: var(--space-12, 48px) var(--space-6, 24px);
        }
        @media (max-width: 768px) {
          .cs-left { display: none; }
          .cs-right { flex: 1; width: 100%; }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "cs-root", children: [
      /* @__PURE__ */ jsxs("div", { className: "cs-left", style: { backgroundColor: brandColor }, children: [
        /* @__PURE__ */ jsx("img", { src: logoSrc, alt: `${portalName} logo`, className: "cs-logo" }),
        /* @__PURE__ */ jsx("h1", { className: "cs-portal-name", children: portalName }),
        /* @__PURE__ */ jsx("p", { className: "cs-tagline", children: tagline })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "cs-right", children: mode === "sign-in" ? /* @__PURE__ */ jsx(SignIn, {}) : /* @__PURE__ */ jsx(SignUp, {}) })
    ] })
  ] });
}

export { ClerkShell };
//# sourceMappingURL=clerk.js.map
//# sourceMappingURL=clerk.js.map