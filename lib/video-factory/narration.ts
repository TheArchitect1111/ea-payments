import fs from 'node:fs/promises';
import path from 'node:path';
import type { VideoProject } from './schema';

export type NarrationProviderId = 'none' | 'openai-tts';

export type NarrationProviderStatus = {
  id: NarrationProviderId;
  available: boolean;
  detail: string;
};

const OPENAI_SPEECH_URL = 'https://api.openai.com/v1/audio/speech';
const DEFAULT_TTS_MODEL = process.env.VIDEO_FACTORY_TTS_MODEL?.trim() || 'gpt-4o-mini-tts';
const DEFAULT_TTS_VOICE = process.env.VIDEO_FACTORY_TTS_VOICE?.trim() || 'cedar';

function requiredOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('OPENAI_API_KEY is required because Money Behind It narration is standard, not optional.');
  }
  return key;
}

export function resolveNarrationProvider(): NarrationProviderStatus {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      id: 'openai-tts',
      available: true,
      detail: `OpenAI TTS ready (${DEFAULT_TTS_MODEL}, voice ${DEFAULT_TTS_VOICE}). Narration is required for final Money Behind It renders.`,
    };
  }
  return {
    id: 'none',
    available: false,
    detail: 'OPENAI_API_KEY is not configured. Final Money Behind It renders must stop rather than publish silently.',
  };
}

export function narrationPublicRelativePath(projectId: string, sceneId: string): string {
  return `video-factory/audio/${projectId}/${sceneId}.mp3`;
}

export function narrationPublicFilePath(projectId: string, sceneId: string): string {
  return path.join(process.cwd(), 'public', narrationPublicRelativePath(projectId, sceneId));
}

async function synthesizeSpeech(text: string): Promise<Buffer> {
  const response = await fetch(OPENAI_SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requiredOpenAiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_TTS_MODEL,
      voice: DEFAULT_TTS_VOICE,
      input: text,
      response_format: 'mp3',
      instructions: 'Narrate as a calm, credible financial documentary host. Conversational, intelligent, measured, and never salesy.',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`OpenAI narration generation failed (${response.status}): ${detail || response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength < 1000) throw new Error('OpenAI narration generation returned an invalid audio file.');
  return bytes;
}

export async function ensureProjectNarration(project: VideoProject, force = false): Promise<string[]> {
  requiredOpenAiKey();
  const created: string[] = [];

  for (const scene of project.scenes) {
    const text = scene.narration?.trim();
    if (!text) continue;

    const filePath = narrationPublicFilePath(project.id, scene.id);
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    if (!force) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.size > 1000) {
          created.push(filePath);
          continue;
        }
      } catch {
        // Generate below.
      }
    }

    const audio = await synthesizeSpeech(text);
    await fs.writeFile(filePath, audio);
    created.push(filePath);
  }

  if (!created.length) throw new Error(`Project ${project.id} has no narration to synthesize.`);
  return created;
}
