import { runAIGateway } from '@/lib/ai/gateway';
import type { AIRequestContext } from '@/lib/ai/types';

export type AmplifiStoryboardScene = {
  number: number;
  purpose: string;
  narration: string;
  visualDirection: string;
  cameraDirection: string;
  onScreenText: string;
  durationSeconds: number;
};

export type AmplifiVideoStoryboard = {
  title: string;
  openingHook: string;
  closingAction: string;
  totalDurationSeconds: number;
  scenes: AmplifiStoryboardScene[];
};

function clean(value: unknown, max = 500) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function fallbackStoryboard(title: string, transcript: string): AmplifiVideoStoryboard {
  const sentences = transcript.split(/(?<=[.!?])\s+/).map((item) => clean(item, 280)).filter(Boolean);
  const beats = sentences.length ? sentences.slice(0, 6) : [transcript];
  const scenes = beats.map((beat, index) => ({
    number: index + 1,
    purpose: index === 0 ? 'Hook attention' : index === beats.length - 1 ? 'Guide the next action' : 'Develop the message',
    narration: beat,
    visualDirection: `Show one clear visual that supports: ${beat}`,
    cameraDirection: index % 2 === 0 ? 'Medium shot with a slow push in' : 'Detail shot with a clean cut',
    onScreenText: beat.split(' ').slice(0, 7).join(' '),
    durationSeconds: 5,
  }));
  return {
    title,
    openingHook: beats[0] ?? title,
    closingAction: beats.at(-1) ?? 'Take the next step.',
    totalDurationSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    scenes,
  };
}

function normalizeStoryboard(value: unknown, fallback: AmplifiVideoStoryboard): AmplifiVideoStoryboard {
  const candidate = value as Partial<AmplifiVideoStoryboard>;
  if (!Array.isArray(candidate.scenes) || candidate.scenes.length === 0) return fallback;
  const scenes = candidate.scenes.slice(0, 10).map((scene, index) => {
    const item = scene as Partial<AmplifiStoryboardScene>;
    return {
      number: index + 1,
      purpose: clean(item.purpose, 120) || 'Develop the message',
      narration: clean(item.narration, 500),
      visualDirection: clean(item.visualDirection, 500),
      cameraDirection: clean(item.cameraDirection, 180),
      onScreenText: clean(item.onScreenText, 120),
      durationSeconds: Math.max(2, Math.min(20, Number(item.durationSeconds) || 5)),
    };
  }).filter((scene) => scene.narration || scene.visualDirection);
  if (!scenes.length) return fallback;
  return {
    title: clean(candidate.title, 160) || fallback.title,
    openingHook: clean(candidate.openingHook, 240) || fallback.openingHook,
    closingAction: clean(candidate.closingAction, 240) || fallback.closingAction,
    totalDurationSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    scenes,
  };
}

export async function buildAmplifiVideoStoryboard(input: {
  title: string;
  transcript: string;
  sourceUrl?: string;
  context: AIRequestContext;
}): Promise<{ storyboard: AmplifiVideoStoryboard; generatedBy: 'ai' | 'structured-fallback' }> {
  const title = clean(input.title, 160) || 'Amplifi video reference';
  const transcript = input.transcript.trim().slice(0, 12000);
  if (transcript.length < 40) throw new Error('Add at least 40 characters of transcript or spoken content.');
  const fallback = fallbackStoryboard(title, transcript);

  try {
    const response = await runAIGateway({
      responseFormat: 'json',
      temperature: 0.15,
      maxOutputTokens: 2200,
      system: 'You are Amplifi Video Architect. Analyze only the supplied transcript. Never claim to have watched a video or inferred visuals that are not described. Return valid JSON only.',
      messages: [{
        role: 'user',
        content: `Create a reusable vertical-video storyboard. Preserve the meaning while improving pacing. Return {title, openingHook, closingAction, totalDurationSeconds, scenes:[{number,purpose,narration,visualDirection,cameraDirection,onScreenText,durationSeconds}]}. Use 3-8 scenes.\n\nTitle: ${title}\nReference URL: ${clean(input.sourceUrl, 500) || 'Not supplied'}\nTranscript:\n${transcript}`,
      }],
      metadata: { feature: 'amplifi-video-storyboard' },
    }, input.context);
    return { storyboard: normalizeStoryboard(JSON.parse(response.text), fallback), generatedBy: 'ai' };
  } catch {
    return { storyboard: fallback, generatedBy: 'structured-fallback' };
  }
}
