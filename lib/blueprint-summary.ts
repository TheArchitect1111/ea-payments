export interface BlueprintSection {
  title: string;
  content: string;
}

export interface BlueprintRoadmapItem {
  phase: string;
  focus: string;
}

export interface ParsedBlueprintSummary {
  meta: string[];
  sections: BlueprintSection[];
  roadmap: BlueprintRoadmapItem[];
}

/** Parse structured blueprint text from formatBlueprintSummary(). */
export function parseBlueprintSummary(summary?: string): ParsedBlueprintSummary {
  if (!summary?.trim()) {
    return { meta: [], sections: [], roadmap: [] };
  }

  const parts = summary.split(/\n---\n/);
  const header = parts[0] ?? '';
  const body = parts.slice(1).join('\n---\n').trim();

  const meta = header
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('Roadmap:'));

  const roadmap: BlueprintRoadmapItem[] = [];
  const roadmapIndex = header.indexOf('Roadmap:');
  if (roadmapIndex !== -1) {
    const roadmapBlock = header.slice(roadmapIndex + 'Roadmap:'.length);
    for (const line of roadmapBlock.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(':');
      if (colon === -1) continue;
      roadmap.push({
        phase: trimmed.slice(0, colon).trim(),
        focus: trimmed.slice(colon + 1).trim(),
      });
    }
  }

  if (body.includes('## ')) {
    const sections = body
      .split(/\n## /)
      .map((block, index) => {
        const normalized = index === 0 && block.startsWith('## ') ? block.slice(3) : block;
        const [titleLine, ...rest] = normalized.split('\n');
        return { title: titleLine.trim(), content: rest.join('\n').trim() };
      })
      .filter((s) => s.title);
    return { meta, sections, roadmap };
  }

  return {
    meta,
    sections: parseLegacySections(summary),
    roadmap,
  };
}

function parseLegacySections(summary: string): BlueprintSection[] {
  return summary
    .split(/\n{2,}|---/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((content, index) => ({
      title: `Insight ${index + 1}`,
      content,
    }));
}

export function parseBlueprintSections(summary?: string): BlueprintSection[] {
  return parseBlueprintSummary(summary).sections;
}

export function parseBlueprintRoadmap(summary?: string): BlueprintRoadmapItem[] {
  return parseBlueprintSummary(summary).roadmap;
}
