export type CreativeFormat =
  | "square"
  | "portrait"
  | "story"
  | "landscape"
  | "carousel"
  | "short-video";

export type CreativeSourceKind =
  | "client-asset"
  | "licensed-image"
  | "generated-image"
  | "graphic-only"
  | "video";

export type CreativeProviderKind =
  | "image-generation"
  | "layout-rendering"
  | "video-rendering"
  | "quality-scoring"
  | "asset-enhancement";

export type CreativeProviderId =
  | "ea-visual-foundry"
  | "openai-image"
  | "comfyui"
  | "stability"
  | "satori-resvg"
  | "fabric"
  | "remotion"
  | "ffmpeg"
  | "creatomate"
  | "q-align"
  | "multimodal-critic";

export interface BrandProfile {
  brandId: string;
  name: string;
  voice?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
  preferredImageStyle?: string;
  prohibitedTerms?: string[];
}

export interface CreativeBrief {
  id: string;
  brand: BrandProfile;
  objective: string;
  audience: string;
  offer?: string;
  message: string;
  callToAction?: string;
  destinationUrl?: string;
  deadline?: string;
  sourceAssets?: string[];
  restrictions?: string[];
}

export interface CreativeSpecification {
  id: string;
  briefId: string;
  format: CreativeFormat;
  sourceKind: CreativeSourceKind;
  headline?: string;
  subhead?: string;
  body?: string;
  callToAction?: string;
  visualDirection: string;
  layoutFamily: string;
  aspectRatio: string;
  width: number;
  height: number;
  durationSeconds?: number;
  sequenceIndex?: number;
}

export interface CreativeAsset {
  id: string;
  specId: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  provider: CreativeProviderId;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface CreativeQAScore {
  strategyRelevance: number;
  composition: number;
  brandConsistency: number;
  readability: number;
  emotionalResonance: number;
  technicalQuality: number;
  overall: number;
}

export interface CreativeQAResult {
  passed: boolean;
  threshold: number;
  score: CreativeQAScore;
  violations: string[];
  recommendations: string[];
}

export interface CreativeProviderCapability {
  provider: CreativeProviderId;
  kind: CreativeProviderKind;
  enabled: boolean;
  commercialSafe: boolean;
  notes?: string;
}
