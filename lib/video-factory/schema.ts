import { z } from 'zod';

export const VIDEO_FACTORY_FPS = 30;
export const VIDEO_FACTORY_WIDTH = 1920;
export const VIDEO_FACTORY_HEIGHT = 1080;

export const videoAspectRatioSchema = z.enum(['16:9']);

export const videoSceneTypeSchema = z.enum([
  'title',
  'narration',
  'image',
  'quote',
  'data',
  'chart',
  'stat',
  'outro',
  'citation',
]);

const citationSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
});

const chartPointSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  note: z.string().optional(),
});

export const videoSceneSchema = z.object({
  id: z.string().min(1),
  type: videoSceneTypeSchema,
  durationInSeconds: z.number().positive().max(60),
  kicker: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  narration: z.string().optional(),
  mediaUrl: z.string().optional(),
  quoteAttribution: z.string().optional(),
  statValue: z.string().optional(),
  statLabel: z.string().optional(),
  chart: z.array(chartPointSchema).optional(),
  citations: z.array(citationSchema).optional(),
});

export const videoProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  topic: z.string().min(1),
  aspectRatio: videoAspectRatioSchema.default('16:9'),
  fps: z.number().int().positive().default(VIDEO_FACTORY_FPS),
  width: z.number().int().positive().default(VIDEO_FACTORY_WIDTH),
  height: z.number().int().positive().default(VIDEO_FACTORY_HEIGHT),
  youtubeTags: z.array(z.string()).optional(),
  soundtrackUrl: z.string().optional(),
  scenes: z.array(videoSceneSchema).min(1),
});

export type VideoScene = z.infer<typeof videoSceneSchema>;
export type VideoProject = z.infer<typeof videoProjectSchema>;
export type VideoSceneType = z.infer<typeof videoSceneTypeSchema>;

export function parseVideoProject(input: unknown): VideoProject {
  return videoProjectSchema.parse(input);
}

export function sceneDurationInFrames(scene: VideoScene, fps = VIDEO_FACTORY_FPS): number {
  return Math.max(1, Math.round(scene.durationInSeconds * fps));
}

export function projectDurationInFrames(project: VideoProject): number {
  return project.scenes.reduce((sum, scene) => sum + sceneDurationInFrames(scene, project.fps), 0);
}

export function projectDurationInSeconds(project: VideoProject): number {
  return project.scenes.reduce((sum, scene) => sum + scene.durationInSeconds, 0);
}
