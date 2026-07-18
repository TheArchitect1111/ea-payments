/**
 * Pure Factory vision label parsing (no AI / asset IO).
 */

function lineValue(text, label, max = 200) {
  const re = new RegExp(
    `^${label}\\s*:\\s*([\\s\\S]+?)(?=\\n[A-Z][A-Z0-9_/+\\- ]{2,40}\\s*:|$)`,
    'im',
  );
  const match = String(text || '').match(re);
  const value = match?.[1]?.replace(/\s+/g, ' ').trim();
  if (!value || /^none$/i.test(value) || /^n\/?a$/i.test(value)) return undefined;
  return value.replace(/^["']|["']$/g, '').slice(0, max);
}

function parseOpportunities(text) {
  const raw = lineValue(text, 'OPPORTUNITIES', 400);
  if (!raw) return [];
  return raw
    .split(/\s*\|\s*|\n|;/)
    .map((part) => part.replace(/^[-*•]\s*/, '').trim())
    .filter((part) => part.length > 8)
    .slice(0, 5);
}

function cleanBusinessName(raw, fallbackName) {
  if (!raw?.trim()) return fallbackName;
  const name = raw
    .replace(/^#+\s*/, '')
    .replace(/^\*+\s*/, '')
    .replace(/^BUSINESS_NAME:\s*/i, '')
    .replace(/\.(jpg|jpeg|png|webp|heic)$/i, '')
    .replace(/^["']|["']$/g, '')
    .trim()
    .slice(0, 120);

  if (!name || name.length < 2) return fallbackName;
  if (/^https?:\/\//i.test(name)) return fallbackName;
  if (/\/api\/ctp\/assets\//i.test(name)) return fallbackName;
  if (/^(screenshot|image capture|photo project|duckduckgo)\b/i.test(name)) return fallbackName;
  if (/^[\w.-]+\.(online|com|org|net|io)$/i.test(name) && /efficiencyarchitects/i.test(name)) {
    return fallbackName;
  }
  return name;
}

export function parseFactoryVisionText(visionText, fallbackName) {
  const labeled = lineValue(visionText, 'BUSINESS_NAME', 120);
  const proseLine = String(visionText || '')
    .split('\n')
    .map((l) => l.trim())
    .find(
      (l) =>
        l.length > 2 &&
        l.length < 80 &&
        !/^#+\s*/.test(l) &&
        !/^(this is|screenshot|image|the photo|BUSINESS_NAME|ENTITY_TYPE|WHO_THEY_ARE|WHAT_THEY_DO|WHO_THEY_SERVE|OFFER|VOICE|PROOF|FRICTION|OPS_CLUE|AUDIENCE|CTA|URL|OPPORTUNITIES|SUMMARY)\b/i.test(
          l,
        ),
    );

  const suggestedClientName = cleanBusinessName(labeled || proseLine, fallbackName);

  const rawUrl =
    lineValue(visionText, 'URL')?.match(/https?:\/\/\S+/i)?.[0] || lineValue(visionText, 'URL');
  const url =
    rawUrl && !/\/api\/ctp\/assets\//i.test(rawUrl) && /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : undefined;

  const audience =
    lineValue(visionText, 'WHO_THEY_SERVE', 200) || lineValue(visionText, 'AUDIENCE', 200);

  return {
    suggestedClientName,
    entityType: lineValue(visionText, 'ENTITY_TYPE', 40),
    whoTheyAre: lineValue(visionText, 'WHO_THEY_ARE', 700),
    whatTheyDo: lineValue(visionText, 'WHAT_THEY_DO', 240),
    audience,
    offer: lineValue(visionText, 'OFFER', 240),
    voice: lineValue(visionText, 'VOICE', 120),
    proof: lineValue(visionText, 'PROOF', 400),
    friction: lineValue(visionText, 'FRICTION', 400),
    opsClue: lineValue(visionText, 'OPS_CLUE', 240),
    cta: lineValue(visionText, 'CTA', 80),
    url,
    opportunities: parseOpportunities(visionText),
    summary:
      lineValue(visionText, 'SUMMARY', 500) ||
      String(visionText || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 420) ||
      `${fallbackName} — visual capture for Concept Pack.`,
  };
}
