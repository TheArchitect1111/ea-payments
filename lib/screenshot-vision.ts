/** Optional Claude vision pass for screenshot / image captures. */
export async function describeScreenshotBase64(
  base64: string,
  mimeType = 'image/png',
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!apiKey || !base64) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType.startsWith('image/') ? mimeType : 'image/png',
                  data: base64.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                type: 'text',
                text: `Describe this screenshot for a business opportunity capture system. Include:
- What type of content this is (website, flyer, recipe, quote, social post, product, etc.)
- Visible text, headlines, business names, URLs, CTAs
- Who the audience might be
- Any marketing or conversion signals

Return plain text only — no markdown fences.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Vision request failed:', await res.text());
      return null;
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((part) => part.type === 'text')?.text?.trim() ?? null;
  } catch (err) {
    console.error('Vision request error:', err);
    return null;
  }
}

export function pngDimensionsFromBase64(base64: string): { width: number; height: number } | null {
  try {
    const raw = base64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(raw, 'base64');
    if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}
