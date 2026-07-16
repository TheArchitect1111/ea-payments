/**
 * External PraisonAI API adapter — optional when PRAISON_AI_API_URL is configured.
 */

import type { ExecutiveIntelligencePackage, WorkforceTriggerInput } from './types';

export function praisonExternalConfigured(): boolean {
  return Boolean(process.env.PRAISON_AI_API_URL?.trim());
}

export async function runExternalPraisonWorkforce(
  input: WorkforceTriggerInput,
): Promise<ExecutiveIntelligencePackage> {
  const baseUrl = process.env.PRAISON_AI_API_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('PRAISON_AI_API_URL not configured.');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiKey = process.env.PRAISON_AI_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl}/v1/workforce/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PraisonAI API ${res.status}: ${text.slice(0, 300)}`);
  }

  return (await res.json()) as ExecutiveIntelligencePackage;
}
