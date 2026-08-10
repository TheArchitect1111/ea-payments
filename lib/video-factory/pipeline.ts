export type VideoStage =
  | 'brief'
  | 'research'
  | 'script'
  | 'scene-plan'
  | 'assets'
  | 'narration'
  | 'render'
  | 'qa'
  | 'publish';

export type StageEvidence = {
  stage: VideoStage;
  passed: boolean;
  artifact?: string;
  detail?: string;
};

export type VideoPipelineState = {
  projectId: string;
  stages: Partial<Record<VideoStage, StageEvidence>>;
};

export const VIDEO_PIPELINE_ORDER: VideoStage[] = [
  'brief',
  'research',
  'script',
  'scene-plan',
  'assets',
  'narration',
  'render',
  'qa',
  'publish',
];

export function nextVideoStage(state: VideoPipelineState): VideoStage | null {
  for (const stage of VIDEO_PIPELINE_ORDER) {
    const evidence = state.stages[stage];
    if (!evidence?.passed) return stage;
  }
  return null;
}

export function videoPipelineComplete(state: VideoPipelineState): boolean {
  return nextVideoStage(state) === null;
}

export function assertVideoStageCanRun(state: VideoPipelineState, stage: VideoStage): void {
  const index = VIDEO_PIPELINE_ORDER.indexOf(stage);
  if (index < 0) throw new Error(`Unknown video stage: ${stage}`);
  const missing = VIDEO_PIPELINE_ORDER.slice(0, index).filter((prior) => !state.stages[prior]?.passed);
  if (missing.length) {
    throw new Error(`Cannot run ${stage}; prerequisite stages not verified: ${missing.join(', ')}`);
  }
}

export function requiredVideoCompletionGates(state: VideoPipelineState) {
  return VIDEO_PIPELINE_ORDER.map((stage) => ({
    name: `video:${stage}`,
    passed: Boolean(state.stages[stage]?.passed),
    detail: state.stages[stage]?.detail ?? '',
    source: state.stages[stage]?.artifact,
  }));
}
