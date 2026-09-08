export type DesignFamilyCategory =
  | "editorial"
  | "promotion"
  | "quote"
  | "event"
  | "product"
  | "education"
  | "storytelling";

export interface DesignFamily {
  id: string;
  name: string;
  category: DesignFamilyCategory;
  formats: string[];
  description: string;
  premium: true;
}

export const CREATIVE_DESIGN_LIBRARY: DesignFamily[] = [
  {
    id: "editorial-hero",
    name: "Editorial Hero",
    category: "editorial",
    formats: ["portrait", "square", "landscape"],
    description: "Large emotionally relevant image, restrained type and one dominant message.",
    premium: true,
  },
  {
    id: "editorial-split",
    name: "Editorial Split",
    category: "editorial",
    formats: ["portrait", "square"],
    description: "Image and message share the frame with strong whitespace and deliberate asymmetry.",
    premium: true,
  },
  {
    id: "promotion-offer",
    name: "Offer Focus",
    category: "promotion",
    formats: ["portrait", "square", "story"],
    description: "Clear offer hierarchy with supporting image and unmistakable CTA.",
    premium: true,
  },
  {
    id: "quote-minimal",
    name: "Minimal Thought",
    category: "quote",
    formats: ["portrait", "square", "story"],
    description: "Typography-led system for thoughts, poems, quotes and recurring series.",
    premium: true,
  },
  {
    id: "event-cinematic",
    name: "Cinematic Event",
    category: "event",
    formats: ["portrait", "square", "story", "landscape"],
    description: "Emotion-first event visual with date, place and action kept secondary to the image.",
    premium: true,
  },
  {
    id: "product-clean",
    name: "Product Clean",
    category: "product",
    formats: ["portrait", "square", "landscape"],
    description: "Product/service focus with controlled background and minimal sales copy.",
    premium: true,
  },
  {
    id: "education-carousel",
    name: "Teach in Slides",
    category: "education",
    formats: ["carousel"],
    description: "Hook, insight, explanation, evidence and CTA narrative for educational carousels.",
    premium: true,
  },
  {
    id: "story-proof",
    name: "Proof Story",
    category: "storytelling",
    formats: ["carousel", "portrait", "short-video"],
    description: "Problem-to-result storytelling for testimonials, case studies and transformations.",
    premium: true,
  },
];

export function getDesignFamiliesForFormat(format: string) {
  return CREATIVE_DESIGN_LIBRARY.filter((family) => family.formats.includes(format));
}
