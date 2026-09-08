import { getDesignFamiliesForFormat } from "./design-library";
import { getCreativeProviderRegistry } from "./provider-registry";
import type {
  CreativeBrief,
  CreativeProviderCapability,
  CreativeProviderKind,
  CreativeSpecification,
} from "./types";

export interface CreativeProductionPlan {
  briefId: string;
  specification: CreativeSpecification;
  providers: Partial<Record<CreativeProviderKind, CreativeProviderCapability>>;
  qaRequired: true;
  regenerateOnFailure: true;
}

function pickProvider(kind: CreativeProviderKind) {
  return getCreativeProviderRegistry().find((provider) => provider.kind === kind && provider.enabled);
}

export function buildCreativeProductionPlan(
  brief: CreativeBrief,
  specification: CreativeSpecification,
): CreativeProductionPlan {
  const availableLayouts = getDesignFamiliesForFormat(specification.format);
  if (!availableLayouts.some((family) => family.id === specification.layoutFamily)) {
    throw new Error(
      `Unknown or incompatible design family ${specification.layoutFamily} for ${specification.format}`,
    );
  }

  const providers: CreativeProductionPlan["providers"] = {
    "asset-enhancement": pickProvider("asset-enhancement"),
    "layout-rendering": pickProvider("layout-rendering"),
    "quality-scoring": pickProvider("quality-scoring"),
  };

  if (specification.sourceKind === "generated-image") {
    providers["image-generation"] = pickProvider("image-generation");
  }

  if (specification.format === "short-video") {
    providers["video-rendering"] = pickProvider("video-rendering");
  }

  if (specification.briefId !== brief.id) {
    throw new Error("Creative specification does not belong to supplied brief");
  }

  return {
    briefId: brief.id,
    specification,
    providers,
    qaRequired: true,
    regenerateOnFailure: true,
  };
}
