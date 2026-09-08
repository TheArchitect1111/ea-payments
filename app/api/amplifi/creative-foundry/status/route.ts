import { NextResponse } from 'next/server';
import { getCreativeProviderRegistry } from '@/lib/creative-foundry/provider-registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = getCreativeProviderRegistry().map((provider) => ({
    provider: provider.provider,
    kind: provider.kind,
    enabled: provider.enabled,
    commercialSafe: provider.commercialSafe,
    notes: provider.notes,
  }));
  const enabled = providers.filter((provider) => provider.enabled);
  const imageGeneration = enabled.find((provider) => provider.kind === 'image-generation');
  const enhancement = enabled.find((provider) => provider.kind === 'asset-enhancement');
  const quality = enabled.find((provider) => provider.kind === 'quality-scoring');
  const layout = enabled.find((provider) => provider.kind === 'layout-rendering');
  const video = enabled.find((provider) => provider.kind === 'video-rendering');

  return NextResponse.json({
    ok: true,
    standard: 'amplifi-premium-visual-v3',
    readiness: {
      generatedImages: Boolean(imageGeneration && quality),
      clientAssetCreative: Boolean(enhancement && quality),
      deterministicLayouts: Boolean(layout),
      video: Boolean(video),
      approvalGate: Boolean(quality),
    },
    selected: {
      imageGeneration: imageGeneration?.provider || null,
      enhancement: enhancement?.provider || null,
      quality: quality?.provider || null,
      layout: layout?.provider || null,
      video: video?.provider || null,
    },
    providers,
  });
}
