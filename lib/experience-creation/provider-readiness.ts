/**
 * Provider readiness for Experience Creation Engine.
 * Missing production credentials → BLOCKED_PROVIDER (never fake finished creative).
 * Vision critic prefers EA OpenAI gateway; Anthropic is optional fallback only.
 */
import { getAIGatewayConfig } from '@/lib/ai/config';
import { isProductionDeploy } from '@/lib/integration-env';
import { resolveVisionCriticProvider } from '@/lib/experience-creation/vision-critic-provider';

export type ProviderStatusCode =
  | 'READY'
  | 'BLOCKED_PROVIDER'
  | 'DEGRADED_OPTIONAL'
  | 'FIXTURE_ONLY';

export type ProviderReadiness = {
  mode: 'production' | 'development' | 'test_fixture';
  status: ProviderStatusCode;
  /** True when research + creative are ready for pack generation. */
  canGeneratePacks: boolean;
  /** True when multimodal vision is ready for production certification. */
  canCertify: boolean;
  research: { ready: boolean; provider: string; missing?: string };
  creative: { ready: boolean; provider: string; missing?: string };
  visionCritic: { ready: boolean; provider: string; missing?: string; model?: string };
  openverse: { ready: boolean; provider: string; notes?: string };
  faceFocal: { ready: boolean; provider: string; notes?: string };
  reasons: string[];
  /** Safe for UI — never includes secret values. */
  configurationHints: string[];
};

function hasOpenAi(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function assessExperienceProviderReadiness(options?: {
  allowDeterministicFixture?: boolean;
}): ProviderReadiness {
  const fixture = Boolean(options?.allowDeterministicFixture);
  const production = isProductionDeploy();
  const mode = fixture ? 'test_fixture' : production ? 'production' : 'development';

  const researchReady = hasOpenAi();
  const creativeReady = Boolean(getAIGatewayConfig().apiKey?.trim());
  const vision = resolveVisionCriticProvider();
  const faceEnabled = process.env.ECE_FACE_FOCAL_ENABLED === '1';

  const reasons: string[] = [];
  const hints: string[] = [];

  if (!researchReady) {
    reasons.push('Research provider unavailable — OPENAI_API_KEY is not configured.');
    hints.push('Set OPENAI_API_KEY for OpenAI web_search research.');
  }
  if (!creativeReady) {
    reasons.push('Creative model provider unavailable — OPENAI_API_KEY is not configured.');
    hints.push('Set OPENAI_API_KEY so the Creative Director can run via the EA AI gateway.');
  }
  if (!vision.ready) {
    reasons.push(
      'Multimodal vision critic unavailable — no vision-capable provider configured.',
    );
    hints.push(
      'Set OPENAI_API_KEY (preferred via EA AI gateway) or ANTHROPIC_API_KEY as fallback for screenshot criticism.',
    );
  }
  if (!faceEnabled) {
    hints.push(
      'Optional: set ECE_FACE_FOCAL_ENABLED=1 and run the face-focal worker for MediaPipe analysis.',
    );
  }

  const canGeneratePacks = researchReady && creativeReady;
  const canCertify = canGeneratePacks && vision.ready;

  let status: ProviderStatusCode = 'READY';
  if (fixture) {
    status = 'FIXTURE_ONLY';
  } else if (!canGeneratePacks) {
    status = 'BLOCKED_PROVIDER';
  } else if (!canCertify || !faceEnabled) {
    status = 'DEGRADED_OPTIONAL';
  }

  return {
    mode,
    status,
    canGeneratePacks,
    canCertify,
    research: {
      ready: researchReady,
      provider: 'openai-web-search',
      missing: researchReady ? undefined : 'OPENAI_API_KEY',
    },
    creative: {
      ready: creativeReady,
      provider: 'ea-ai-gateway',
      missing: creativeReady ? undefined : 'OPENAI_API_KEY',
    },
    visionCritic: {
      ready: vision.ready,
      provider: vision.id,
      model: vision.model,
      missing: vision.missing,
    },
    openverse: {
      ready: true,
      provider: 'openverse-api',
      notes: 'Public API; rate limits apply. License metadata must be verified.',
    },
    faceFocal: {
      ready: faceEnabled,
      provider: 'mediapipe-face-detector',
      notes: faceEnabled
        ? 'MediaPipe worker enabled'
        : 'Deferred until ECE_FACE_FOCAL_ENABLED=1 — geometric crop hints only',
    },
    reasons,
    configurationHints: hints,
  };
}

export function isDeterministicCreativeAllowed(options?: {
  allowDeterministicFixture?: boolean;
}): boolean {
  return Boolean(options?.allowDeterministicFixture);
}
