import type { CreativeProviderCapability } from "./types";

const truthy = new Set(["1", "true", "yes", "on"]);

function envEnabled(name: string, defaultValue = false) {
  const value = process.env[name];
  if (value == null) return defaultValue;
  return truthy.has(value.toLowerCase());
}

export function getCreativeProviderRegistry(): CreativeProviderCapability[] {
  return [
    {
      provider: "ea-visual-foundry",
      kind: "asset-enhancement",
      enabled: envEnabled("CREATIVE_EA_VISUAL_FOUNDRY_ENABLED", true),
      commercialSafe: true,
      notes: "Shared EA subject extraction, relighting, depth and enhancement chain.",
    },
    {
      provider: "openai-image",
      kind: "image-generation",
      enabled: Boolean(process.env.OPENAI_API_KEY),
      commercialSafe: true,
      notes: "Existing Amplifi generated-image fallback in creative-studio/image-engine.ts. Uses the configured OpenAI image model.",
    },
    {
      provider: "comfyui",
      kind: "image-generation",
      enabled: envEnabled("CREATIVE_COMFYUI_ENABLED"),
      commercialSafe: true,
      notes: "Advanced workflow orchestrator. Individual model licenses must still be checked.",
    },
    {
      provider: "stability",
      kind: "image-generation",
      enabled: Boolean(process.env.STABILITY_API_KEY),
      commercialSafe: true,
      notes: "Optional commercial image-generation provider when configured.",
    },
    {
      provider: "satori-resvg",
      kind: "layout-rendering",
      enabled: envEnabled("CREATIVE_SATORI_RESVG_ENABLED", true),
      commercialSafe: true,
      notes: "Deterministic typography and social graphic rendering through the existing Next/OG/SVG production path.",
    },
    {
      provider: "fabric",
      kind: "layout-rendering",
      enabled: envEnabled("CREATIVE_FABRIC_ENABLED"),
      commercialSafe: true,
      notes: "Interactive/editable canvas target for richer layouts.",
    },
    {
      provider: "remotion",
      kind: "video-rendering",
      enabled: true,
      commercialSafe: true,
      notes: "Already present in the repository; license threshold must be monitored as EA grows.",
    },
    {
      provider: "ffmpeg",
      kind: "video-rendering",
      enabled: envEnabled("CREATIVE_FFMPEG_ENABLED", true),
      commercialSafe: true,
      notes: "Encoding/compositing runtime; deployment image must include ffmpeg.",
    },
    {
      provider: "creatomate",
      kind: "video-rendering",
      enabled: Boolean(process.env.CREATOMATE_API_KEY),
      commercialSafe: true,
      notes: "Commercial rendering accelerator/fallback, not creative brain.",
    },
    {
      provider: "q-align",
      kind: "quality-scoring",
      enabled: envEnabled("CREATIVE_QALIGN_ENABLED"),
      commercialSafe: true,
      notes: "Aesthetic/technical scoring worker target.",
    },
    {
      provider: "multimodal-critic",
      kind: "quality-scoring",
      enabled: envEnabled("CREATIVE_MULTIMODAL_CRITIC_ENABLED", true),
      commercialSafe: true,
      notes: "Campaign/brand/creative critique layer using the configured multimodal model.",
    },
  ];
}

export function getEnabledCreativeProviders() {
  return getCreativeProviderRegistry().filter((provider) => provider.enabled);
}

export function assertCommercialCreativeStack() {
  const unsafe = getEnabledCreativeProviders().filter((provider) => !provider.commercialSafe);
  if (unsafe.length) {
    throw new Error(`Unsafe creative providers enabled: ${unsafe.map((p) => p.provider).join(", ")}`);
  }
}
