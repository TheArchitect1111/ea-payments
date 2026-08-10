import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoProject, VideoScene } from '../../lib/video-factory/schema';
import { sceneDurationInFrames } from '../../lib/video-factory/schema';
import { CaptionLayer } from './components/CaptionLayer';
import { ChartScene } from './components/ChartScene';
import { SceneFrame } from './components/SceneFrame';
import { SourceCitation } from './components/SourceCitation';
import { GOLD, MUTED, WHITE } from './palette';

export type EaEpisodeProps = {
  project: VideoProject;
};

function narrationAsset(projectId: string, sceneId: string): string {
  return `video-factory/audio/${projectId}/${sceneId}.mp3`;
}

function BrandBug() {
  return (
    <div style={{ position: 'absolute', right: 118, top: 62, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 8, height: 8, borderRadius: 99, background: GOLD }} />
      <div style={{ color: 'rgba(247,244,238,.7)', letterSpacing: 3.4, textTransform: 'uppercase', fontSize: 16, fontWeight: 700 }}>
        The Money Behind It
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <div style={{ color: GOLD, letterSpacing: 4.5, textTransform: 'uppercase', fontSize: 22, fontWeight: 800, marginBottom: 26 }}>
      {children}
    </div>
  );
}

function EditorialHeadline({ children, size = 78 }: { children?: string; size?: number }) {
  return (
    <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: size, lineHeight: 1.03, fontWeight: 700, color: WHITE, maxWidth: 1400, letterSpacing: -2 }}>
      {children}
    </div>
  );
}

function RuleLabel({ children }: { children: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{ width: 46, height: 3, background: GOLD }} />
      <div style={{ color: MUTED, fontSize: 18, letterSpacing: 2.6, textTransform: 'uppercase', fontWeight: 700 }}>{children}</div>
    </div>
  );
}

function NarrationScene({ scene }: { scene: VideoScene }) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shift = interpolate(frame, [4, 22], [38, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 72, alignItems: 'center', height: '100%' }}>
      <div style={{ opacity: enter, transform: `translateY(${shift}px)` }}>
        <Eyebrow>{scene.kicker}</Eyebrow>
        <EditorialHeadline>{scene.headline}</EditorialHeadline>
        <div style={{ marginTop: 34, maxWidth: 1120, color: MUTED, fontSize: 32, lineHeight: 1.45 }}>{scene.body}</div>
      </div>
      <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(201,168,68,.28)', position: 'absolute' }} />
        <div style={{ width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,.10)', position: 'absolute' }} />
        <div style={{ width: 165, height: 165, borderRadius: 28, transform: 'rotate(45deg)', border: '2px solid rgba(201,168,68,.56)', background: 'rgba(201,168,68,.06)' }} />
        <div style={{ position: 'absolute', color: WHITE, fontFamily: 'Georgia, Times New Roman, serif', fontSize: 76, fontWeight: 700 }}>$</div>
      </div>
    </div>
  );
}

function SceneBody({ scene }: { scene: VideoScene }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 1], { extrapolateRight: 'clamp' });

  if (scene.type === 'title') {
    const reveal = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <RuleLabel>Money • Power • Decisions</RuleLabel>
        <div style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 44}px)` }}>
          <Eyebrow>{scene.kicker}</Eyebrow>
          <EditorialHeadline size={104}>{scene.headline}</EditorialHeadline>
          <div style={{ marginTop: 34, fontSize: 42, lineHeight: 1.25, color: MUTED, maxWidth: 1180 }}>{scene.body}</div>
        </div>
        <div style={{ position: 'absolute', right: 128, bottom: 144, fontSize: 180, fontFamily: 'Georgia, Times New Roman, serif', color: 'rgba(201,168,68,.13)', fontWeight: 700 }}>
          01
        </div>
      </div>
    );
  }

  if (scene.type === 'quote') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1460 }}>
        <Eyebrow>{scene.kicker}</Eyebrow>
        <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 82, lineHeight: 1.12, color: WHITE, fontWeight: 700 }}>
          “{scene.body || scene.headline}”
        </div>
        <div style={{ marginTop: 36, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', fontSize: 20, fontWeight: 800 }}>
          {scene.quoteAttribution}
        </div>
      </div>
    );
  }

  if (scene.type === 'stat') {
    const scale = interpolate(frame, [0, 16], [0.86, 1], { extrapolateRight: 'clamp' });
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '.72fr 1.28fr', gap: 64, alignItems: 'center' }}>
        <div>
          <Eyebrow>{scene.kicker}</Eyebrow>
          <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 54, color: WHITE, lineHeight: 1.08 }}>{scene.headline}</div>
        </div>
        <div style={{ borderLeft: '1px solid rgba(201,168,68,.35)', paddingLeft: 72 }}>
          <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 82, lineHeight: 1.03, color: GOLD, fontWeight: 700, transform: `scale(${scale})`, transformOrigin: 'left center' }}>
            {scene.statValue}
          </div>
          <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.35, color: MUTED }}>{scene.statLabel}</div>
        </div>
      </div>
    );
  }

  if (scene.type === 'chart') {
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 64, alignItems: 'center' }}>
        <div>
          <Eyebrow>{scene.kicker}</Eyebrow>
          <EditorialHeadline size={66}>{scene.headline}</EditorialHeadline>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: MUTED, marginTop: 28 }}>{scene.body}</div>
        </div>
        <div style={{ background: 'rgba(8,14,28,.38)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 28, padding: '36px 38px 28px', boxShadow: '0 30px 90px rgba(0,0,0,.22)' }}>
          <ChartScene chart={scene.chart} />
        </div>
      </div>
    );
  }

  if (scene.type === 'citation') {
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '.72fr 1.28fr', gap: 68, alignItems: 'center' }}>
        <div>
          <Eyebrow>{scene.kicker}</Eyebrow>
          <EditorialHeadline size={64}>{scene.headline}</EditorialHeadline>
        </div>
        <div style={{ background: 'rgba(8,14,28,.34)', borderRadius: 26, border: '1px solid rgba(255,255,255,.08)', padding: 30 }}>
          <SourceCitation citations={scene.citations} />
        </div>
      </div>
    );
  }

  if (scene.type === 'outro') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1440 }}>
        <Eyebrow>{scene.kicker}</Eyebrow>
        <EditorialHeadline size={86}>{scene.headline}</EditorialHeadline>
        <div style={{ fontSize: 32, lineHeight: 1.45, color: MUTED, maxWidth: 1080, marginTop: 32 }}>{scene.body}</div>
        <div style={{ display: 'flex', gap: 18, marginTop: 46, alignItems: 'center' }}>
          <div style={{ padding: '14px 22px', borderRadius: 999, background: GOLD, color: '#111827', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900, fontSize: 16 }}>Follow the money</div>
          <div style={{ color: MUTED, fontSize: 19 }}>Subscribe for the next story behind the numbers.</div>
        </div>
      </div>
    );
  }

  if (scene.type === 'image' && scene.mediaUrl) {
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <Eyebrow>{scene.kicker}</Eyebrow>
          <EditorialHeadline size={68}>{scene.headline}</EditorialHeadline>
          <div style={{ marginTop: 30, fontSize: 30, lineHeight: 1.45, color: MUTED }}>{scene.body}</div>
        </div>
        <img src={scene.mediaUrl} style={{ width: '100%', height: 610, objectFit: 'cover', borderRadius: 28, border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 36px 100px rgba(0,0,0,.38)' }} />
      </div>
    );
  }

  return <NarrationScene scene={scene} />;
}

function TimedScene({ projectId, scene, index, total }: { projectId: string; scene: VideoScene; index: number; total: number }) {
  const narrationAudio = scene.narration?.trim() ? staticFile(narrationAsset(projectId, scene.id)) : null;

  return (
    <SceneFrame>
      {narrationAudio ? <Audio src={narrationAudio} volume={1} /> : null}
      <BrandBug />
      <SceneBody scene={scene} />
      <CaptionLayer text={scene.narration} appearAt={scene.type === 'title' ? 18 : 10} />
      <div style={{ position: 'absolute', left: 118, bottom: 48, color: 'rgba(247,244,238,.46)', fontSize: 15, letterSpacing: 2.2, textTransform: 'uppercase' }}>
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </SceneFrame>
  );
}

function sceneStartFrames(project: VideoProject): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (const scene of project.scenes) {
    starts.push(cursor);
    cursor += sceneDurationInFrames(scene, project.fps);
  }
  return starts;
}

export function EaEpisode({ project }: EaEpisodeProps) {
  const starts = sceneStartFrames(project);
  return (
    <AbsoluteFill style={{ background: '#0d1424' }}>
      {project.scenes.map((scene, index) => {
        const durationInFrames = sceneDurationInFrames(scene, project.fps);
        return (
          <Sequence key={scene.id} from={starts[index] ?? 0} durationInFrames={durationInFrames}>
            <TimedScene projectId={project.id} scene={scene} index={index} total={project.scenes.length} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
