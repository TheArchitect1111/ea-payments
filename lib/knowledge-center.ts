/** Minimal knowledge assets listing for executive command search. */
export type KnowledgeAsset = {
  id: string;
  title: string;
  summary?: string;
  href?: string;
  owner?: string;
};

export function listKnowledgeAssets(): KnowledgeAsset[] {
  return [];
}
