'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// instant-feel/motion.ts
var eaMotion = {
  tap: 120,
  small: 180,
  menu: 220,
  page: 300,
  large: 400
};
function useOptimisticSave(options = {}) {
  const savedMs = options.savedMs ?? 2400;
  const [status, setStatus] = react.useState("idle");
  const [error, setError] = react.useState("");
  const timerRef = react.useRef(void 0);
  react.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
  const run = react.useCallback(
    async (work, onOptimistic) => {
      setError("");
      setStatus("saving");
      onOptimistic?.();
      try {
        const result = await work();
        setStatus("saved");
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatus("idle"), savedMs);
        return result;
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Save failed");
        return void 0;
      }
    },
    [savedMs]
  );
  const reset = react.useCallback(() => {
    setStatus("idle");
    setError("");
  }, []);
  return { status, error, run, reset };
}
var LABEL = {
  idle: null,
  saving: "Saving\u2026",
  saved: "\u2713 Saved",
  error: "Could not save"
};
function OptimisticSaveBadge({ status, error, className = "" }) {
  const label = status === "error" && error ? error : LABEL[status];
  if (!label) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      className: `pc-save-badge pc-save-badge-${status} ${className}`.trim(),
      role: "status",
      "aria-live": "polite",
      children: label
    }
  );
}
function SkeletonBlock({ lines = 3, className = "" }) {
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: `pc-skeleton pc-skeleton-card ${className}`.trim(), "aria-hidden": "true", children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsxRuntime.jsx("div", { className: "pc-skeleton-line" }, i)) });
}
function InstantFeelButton({
  children,
  variant = "primary",
  glow = false,
  className = "",
  type = "button",
  ...rest
}) {
  const variantClass = variant === "secondary" ? "pc-btn-secondary" : variant === "ghost" ? "pc-btn-ghost" : "pc-btn-primary";
  return /* @__PURE__ */ jsxRuntime.jsx(
    "button",
    {
      type,
      className: `pc-btn pc-tap ${glow ? "pc-tap-glow" : ""} ${variantClass} ${className}`.trim(),
      ...rest,
      children
    }
  );
}
function ProgressMomentum({ label, className = "" }) {
  return /* @__PURE__ */ jsxRuntime.jsx("span", { className: `pc-progress-chip ${className}`.trim(), role: "status", children: label });
}

exports.InstantFeelButton = InstantFeelButton;
exports.OptimisticSaveBadge = OptimisticSaveBadge;
exports.ProgressMomentum = ProgressMomentum;
exports.SkeletonBlock = SkeletonBlock;
exports.eaMotion = eaMotion;
exports.useOptimisticSave = useOptimisticSave;
//# sourceMappingURL=instant-feel.cjs.map
//# sourceMappingURL=instant-feel.cjs.map