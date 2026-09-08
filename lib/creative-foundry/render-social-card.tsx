import { ImageResponse } from "next/og";
import type { CreativeBrief, CreativeSpecification } from "./types";

function safeColor(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? value : fallback;
}

export function renderSocialCard(brief: CreativeBrief, spec: CreativeSpecification) {
  if (spec.format === "short-video" || spec.format === "carousel") {
    throw new Error(`renderSocialCard does not render ${spec.format}`);
  }

  const primary = safeColor(brief.brand.primaryColor, "#0b0b0c");
  const accent = safeColor(brief.brand.accentColor, "#ffffff");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: primary,
          color: accent,
          padding: Math.max(48, Math.round(spec.width * 0.065)),
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: Math.max(24, Math.round(spec.width * 0.025)), opacity: 0.72 }}>
          {brief.brand.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: "88%" }}>
          <div
            style={{
              display: "flex",
              fontWeight: 700,
              fontSize: Math.max(54, Math.round(spec.width * 0.072)),
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
            }}
          >
            {spec.headline || brief.message}
          </div>
          {spec.subhead ? (
            <div
              style={{
                display: "flex",
                fontSize: Math.max(28, Math.round(spec.width * 0.033)),
                lineHeight: 1.25,
                opacity: 0.82,
              }}
            >
              {spec.subhead}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: Math.max(22, Math.round(spec.width * 0.024)),
          }}
        >
          <div style={{ display: "flex", opacity: 0.68 }}>{brief.objective}</div>
          {spec.callToAction ? (
            <div
              style={{
                display: "flex",
                border: `2px solid ${accent}`,
                borderRadius: 999,
                padding: "14px 24px",
                fontWeight: 700,
              }}
            >
              {spec.callToAction}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      width: spec.width,
      height: spec.height,
    },
  );
}
