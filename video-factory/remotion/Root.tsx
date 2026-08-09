import { Composition } from 'remotion';
import { getVideoProject, listVideoProjects } from '../../lib/video-factory/registry';
import { wealthyDebtProject } from '../../lib/video-factory/projects/wealthy-debt';
import {
  VIDEO_FACTORY_FPS,
  VIDEO_FACTORY_HEIGHT,
  VIDEO_FACTORY_WIDTH,
  projectDurationInFrames,
} from '../../lib/video-factory/schema';
import { EaEpisode } from './EaEpisode';

export function RemotionRoot() {
  const projects = listVideoProjects();

  return (
    <>
      {projects.map((project) => (
        <Composition
          key={project.id}
          id={project.id}
          component={EaEpisode}
          durationInFrames={projectDurationInFrames(project)}
          fps={project.fps ?? VIDEO_FACTORY_FPS}
          width={project.width ?? VIDEO_FACTORY_WIDTH}
          height={project.height ?? VIDEO_FACTORY_HEIGHT}
          defaultProps={{ project }}
          calculateMetadata={({ props }) => {
            const resolved = props.project ?? getVideoProject(project.id) ?? wealthyDebtProject;
            return {
              durationInFrames: projectDurationInFrames(resolved),
              fps: resolved.fps,
              width: resolved.width,
              height: resolved.height,
            };
          }}
        />
      ))}
    </>
  );
}
