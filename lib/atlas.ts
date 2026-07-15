/** Minimal Atlas object listing for executive command search. */
export type AtlasObject = {
  id: string;
  name: string;
  type: string;
  summary?: string;
  href?: string;
};

export async function listAtlasObjects(): Promise<AtlasObject[]> {
  return [];
}
