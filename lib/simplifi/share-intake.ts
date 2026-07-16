/**
 * Parse PWA / OS share-target query params into capture seeds.
 * Manifest declares title, text, url — all must land in the same capture loop.
 */

export type ShareTargetParams = {
  url?: string | null;
  text?: string | null;
  title?: string | null;
};

export type ShareIntake = {
  url: string;
  notes: string;
};

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i;

export function parseShareTargetParams(input: ShareTargetParams): ShareIntake {
  const urlParam = input.url?.trim() ?? '';
  const text = input.text?.trim() ?? '';
  const title = input.title?.trim() ?? '';

  const urlFromText = text.match(URL_IN_TEXT)?.[0] ?? '';
  const url = urlParam || urlFromText;

  const textWithoutUrl = urlFromText ? text.replace(urlFromText, '').trim() : text;
  const notes = [title, textWithoutUrl].filter(Boolean).join('\n').trim().slice(0, 4000);

  return { url, notes };
}
