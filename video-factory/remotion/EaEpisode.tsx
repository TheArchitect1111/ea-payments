import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import type { VideoProject, VideoScene } from '../../lib/video-factory/schema';
import { sceneDurationInFrames } from '../../lib/video-factory/schema';
import { CaptionLayer } from './components/CaptionLayer';
import { ChartScene } from './components/ChartScene';
import { LowerThird } from './components/LowerThird';
import { SceneFrame } from './components/SceneFrame';
import { SourceCitation } from './components/SourceCitation';
import { GOLD, MUTED, WHITE } from './palette';

export type EaEpisodeProps = {
  project: VideoProject;
};

function SceneBody({ scene }: { scene: VideoScene }) {
  if (scene.type === 'title') {
    return (
      <>
        <div style={{ color: GOLD, letterSpacing: 5, textTransform: 'uppercase', fontSize: 24, marginBottom: 28 }}>
          {scene.kicker}
        </div>
        <div style={{ fontSize: 92, lineHeight: 1.02, fontWeight: 650, maxWidth: 1500, color: WHITE }}>
          {scene.headline}
        </div>
        <div style={{ marginTop: 28, fontSize: 42, color: MUTED, maxWidth: 1100 }}>{scene.body}</div>
      </>
    );
  }

  if (scene.type === 'quote') {
    return (
      <>
        <LowerThird kicker={scene.kicker} headline={scene.headline} />
        <div style={{ fontSize: 56, lineHeight: 1.2, color: WHITE, maxWidth: 1400, fontStyle: 'italic' }}>
          “{scene.body || scene.headline}”
        </div>
        {scene.quoteAttribution ? (
          <div style={{ marginTop: 28, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontSize: 22 }}>
            {scene.quoteAttribution}
          </div>
        ) : null}
      </>
    );
  }

  if (scene.type === 'stat') {
    return (
      <>
        <LowerThird kicker={scene.kicker} headline={scene.headline} />
        <div style={{ fontSize: 120, color: GOLD, fontWeight: 700, marginTop: 12 }}>{scene.statValue}</div>
        <div style={{ fontSize: 36, color: WHITE, maxWidth: 1200, marginTop: 12 }}>{scene.statLabel}</div>
      </>
    );
  }

  if (scene.type === 'chart') {
    return (
      <>
        <LowerThird kicker={scene.kicker} headline={scene.headline} />
        <div style={{ fontSize: 28, color: MUTED, maxWidth: 1200 }}>{scene.body}</div>
        <ChartScene chart={scene.chart} />
      </>
    );
  }

  if (scene.type === 'citation') {
    return (
      <>
        <LowerThird kicker={scene.kicker} headline={scene.headline} />
        <SourceCitation citations={scene.citations} />
      </>
    );
  }

  if (scene.type === 'outro') {
    return (
      <>
        <div style={{ color: GOLD, letterSpacing: 5, textTransform: 'uppercase', fontSize: 22 }}>{scene.kicker}</div>
        <div style={{ fontSize: 78, color: WHITE, maxWidth: 1400, marginTop: 24, lineHeight: 1.05 }}>{scene.headline}</div>
        <div style={{ fontSize: 34, color: MUTED, maxWidth: 1100, marginTop: 28 }}>{scene.body}</div>
      </>
    );
  }

  return (
    <>
      <LowerThird kicker={scene.kicker} headline={scene.headline} />
      <div style={{ fontSize: 34, lineHeight: 1.4, color: WHITE, maxWidth: 1280 }}>{scene.body}</div>
    </>
  );
}

function TimedScene({ scene }: { scene: VideoScene }) {
  const frame = useCurrentFrame();
  return (
    <SceneFrame>
      <SceneBody scene={scene} />
      <CaptionLayer text={scene.narration} appearAt={scene.type === 'title' ? 18 : 10} />
      <div
        style={{
          position: 'absolute',
          right: 110,
          top: 48,
          color: MUTED,
          letterSpacing: 3,
          textTransform: 'uppercase',
          fontSize: 16,
          opacity: frame > 4 ? 1 : 0,
        }}
      >
        EA Video Factory
      </div>
    </SceneFrame>
  );
}

export function EaEpisode({ project }: EaEpisodeProps) {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: '#0d1424' }}>
      {project.scenes.map((scene) => {
        const durationInFrames = sceneDurationInFrames(scene, project.fps);
        const start = from;
        from += durationInFrames;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={durationInFrames}>
            <TimedScene scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
