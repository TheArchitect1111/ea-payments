export interface EnhancementAssessment {
  level: 'Level 1 Minor Enhancement' | 'Level 2 Feature Addition' | 'Level 3 Major Enhancement';
  reasoning: string;
  estimatedRange: string;
}

async function callClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!apiKey) return null;

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
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Claude request failed:', detail);
      return null;
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((part) => part.type === 'text')?.text?.trim() ?? null;
  } catch (err) {
    console.error('Claude request error:', err);
    return null;
  }
}

export async function enhanceContentRequest(input: string): Promise<string> {
  const fallback = input.trim();
  const enhanced = await callClaude(
    `You are an expert content writer for business websites. The client submitted the following content update request. Enhance the content to be professional, clear, and engaging while preserving the client's intent. Return only the enhanced content, no explanation.\n\n${fallback}`
  );
  return enhanced || fallback;
}

export async function assessEnhancementRequest(input: {
  enhancementType: string;
  description: string;
  businessGoal: string;
}): Promise<EnhancementAssessment> {
  const fallback: EnhancementAssessment = {
    level: 'Level 2 Feature Addition',
    reasoning: 'This request needs review before a final estimate is sent.',
    estimatedRange: '$300-$1,500',
  };

  const response = await callClaude(
    `You are an EA project evaluator. Based on this enhancement request, categorize it as Level 1 (Minor Enhancement, $99-$299), Level 2 (Feature Addition, $300-$1,500), or Level 3 (Major Enhancement, requires custom proposal). Return JSON: { level: 'Level 1|2|3', reasoning: '...', estimatedRange: '...' }\n\nEnhancement Type: ${input.enhancementType}\nDescription: ${input.description}\nBusiness Goal: ${input.businessGoal}`
  );

  if (!response) return fallback;

  try {
    const cleaned = response.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned) as { level?: string; reasoning?: string; estimatedRange?: string };
    const levelMap: Record<string, EnhancementAssessment['level']> = {
      'Level 1': 'Level 1 Minor Enhancement',
      'Level 2': 'Level 2 Feature Addition',
      'Level 3': 'Level 3 Major Enhancement',
      'Level 1 Minor Enhancement': 'Level 1 Minor Enhancement',
      'Level 2 Feature Addition': 'Level 2 Feature Addition',
      'Level 3 Major Enhancement': 'Level 3 Major Enhancement',
    };

    return {
      level: levelMap[parsed.level ?? ''] ?? fallback.level,
      reasoning: parsed.reasoning ?? fallback.reasoning,
      estimatedRange: parsed.estimatedRange ?? fallback.estimatedRange,
    };
  } catch {
    return fallback;
  }
}
