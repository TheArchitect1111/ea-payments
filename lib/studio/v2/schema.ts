import {z} from 'zod';

export const ArtifactType=z.enum(['poster','landing-page','website','portal','presentation','social','motion']);
export type ArtifactType=z.infer<typeof ArtifactType>;

export const StudioFact=z.object({label:z.string(),value:z.string(),priority:z.enum(['primary','secondary','supporting']).default('secondary')});
export const StudioAsset=z.object({id:z.string(),kind:z.enum(['logo','photo','heritage','qr','icon','texture']),url:z.string().optional(),approved:z.boolean().default(false),requirements:z.array(z.string()).default([])});
export const CompositionCandidate=z.object({
 id:z.string(),
 name:z.string(),
 thesis:z.string(),
 heroStrategy:z.string(),
 informationFlow:z.array(z.string()),
 geometry:z.string(),
 imageTreatment:z.string(),
 typographyStrategy:z.string(),
 ctaStrategy:z.string(),
 differentiation:z.string(),
});
export type CompositionCandidate=z.infer<typeof CompositionCandidate>;

export const StudioBriefV2=z.object({
 projectId:z.string(),
 title:z.string(),
 artifactType:ArtifactType,
 audience:z.string(),
 viewingContext:z.string(),
 objective:z.string(),
 facts:z.array(StudioFact).min(1),
 assets:z.array(StudioAsset),
 referenceSignals:z.array(z.string()).min(1),
 nonNegotiables:z.array(z.string()).default([]),
 antiPatterns:z.array(z.string()).default([]),
 targetSizes:z.array(z.object({name:z.string(),width:z.number().int().positive(),height:z.number().int().positive()})).min(1),
});
export type StudioBriefV2=z.infer<typeof StudioBriefV2>;

export const ReviewScores=z.object({visualImpact:z.number().min(0).max(10),artifactFit:z.number().min(0).max(10),brandIntegrity:z.number().min(0).max(10),referenceMatch:z.number().min(0).max(10),hierarchy:z.number().min(0).max(10),readability:z.number().min(0).max(10),conversionClarity:z.number().min(0).max(10),technicalIntegrity:z.number().min(0).max(10)});
export type ReviewScores=z.infer<typeof ReviewScores>;

export const StudioReview=z.object({scores:ReviewScores,hardFailures:z.array(z.string()).default([]),notes:z.array(z.string()).default([])});
export type StudioReview=z.infer<typeof StudioReview>;

export function passesFirstRenderGate(review:StudioReview,floor=9){return review.hardFailures.length===0&&Object.values(review.scores).every(v=>v>=floor)}
