import { parseVideoProject, type VideoProject } from './schema';
import { wealthyDebtProject } from './projects/wealthy-debt';

const PROJECTS: Record<string, VideoProject> = {
  [wealthyDebtProject.id]: parseVideoProject(wealthyDebtProject),
};

export function listVideoProjects(): VideoProject[] {
  return Object.values(PROJECTS);
}

export function getVideoProject(id: string): VideoProject | null {
  return PROJECTS[id] ?? null;
}

export function resolveVideoProject(input: { projectId?: string; topic?: string }): VideoProject {
  const requested = input.projectId?.trim();
  if (requested) {
    const found = getVideoProject(requested);
    if (found) return found;
  }

  const topic = input.topic?.trim().toLowerCase() ?? '';
  if (topic.includes('debt') || topic.includes('wealthy')) {
    return wealthyDebtProject;
  }

  return wealthyDebtProject;
}
