import { getAIGatewayConfig } from '@/lib/ai/config';

export type AIProviderHealth = {
  id: 'gateway' | 'omniroute' | 'openai';
  label: string;
  configured: boolean;
  role: 'primary' | 'secondary' | 'emergency';
  detail: string;
};

export type AIProviderHealthReport = {
  available: boolean;
  configuredProviders: number;
  providers: AIProviderHealth[];
  gatewayModels: string[];
  summary: string;
};

export function buildAIProviderHealthReport(): AIProviderHealthReport {
  const config = getAIGatewayConfig();
  const configured = new Set(config.providers.map((provider) => provider.id));
  const onVercel = Boolean(process.env.VERCEL);
  const gatewayConfigured = configured.has('gateway');

  const providers: AIProviderHealth[] = [
    {
      id: 'gateway',
      label: 'Vercel AI Gateway',
      configured: gatewayConfigured,
      role: 'primary',
      detail: gatewayConfigured
        ? `Configured${onVercel && !process.env.AI_GATEWAY_API_KEY ? ' through Vercel OIDC' : ''}; model fallback: ${config.gatewayModels.join(' → ')}.`
        : 'No AI Gateway credential or Vercel runtime identity is available.',
    },
    {
      id: 'omniroute',
      label: 'OmniRoute',
      configured: configured.has('omniroute'),
      role: 'secondary',
      detail: configured.has('omniroute') ? 'Configured as the second provider fallback.' : 'Not configured; optional secondary provider.',
    },
    {
      id: 'openai',
      label: 'Direct OpenAI',
      configured: configured.has('openai'),
      role: 'emergency',
      detail: configured.has('openai') ? 'Configured as the direct emergency fallback.' : 'Not configured; Gateway may still provide OpenAI models.',
    },
  ];

  const configuredProviders = providers.filter((provider) => provider.configured).length;
  return {
    available: configuredProviders > 0,
    configuredProviders,
    providers,
    gatewayModels: config.gatewayModels,
    summary: configuredProviders > 0
      ? `${configuredProviders} AI provider path${configuredProviders === 1 ? '' : 's'} configured; primary routing uses Vercel AI Gateway when available.`
      : 'No AI provider path is configured.',
  };
}

export function aiProviderAvailable(): boolean {
  return buildAIProviderHealthReport().available;
}
