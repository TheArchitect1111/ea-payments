import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { getCampaign, saveCampaign } from '@/lib/creative-studio/campaign-store';
import { getMediaAsset } from '@/lib/creative-studio/media-store';
import { validateMediaForAsset } from '@/lib/creative-studio/media-validation';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  let body: { assetId?: string; mediaId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) {
    return NextResponse.json({ ok: false, error: 'Campaign not found.' }, { status: 404 });
  }

  const asset = campaign.assets.find((item) => item.id === body.assetId);
  if (!asset) {
    return NextResponse.json({ ok: false, error: 'Campaign asset not found.' }, { status: 404 });
  }

  const media = body.mediaId ? await getMediaAsset(body.mediaId) : null;
  if (!media || media.organizationId !== campaign.organizationId) {
    return NextResponse.json(
      { ok: false, error: 'Media asset not found for this organization.' },
      { status: 404 },
    );
  }

  const mediaValidation = validateMediaForAsset(asset, media);
  const assets = campaign.assets.map((item) =>
    item.id === asset.id
      ? {
          ...item,
          mediaIds: [media.id],
          thumbnailUrl: media.kind === 'image' ? media.url : item.thumbnailUrl,
          status: mediaValidation.valid ? ('ready' as const) : ('blocked' as const),
          mediaValidation,
          approval: { status: 'not-requested' as const },
          schedule: undefined,
        }
      : item,
  );
  const updated = await saveCampaign({ ...campaign, assets });

  return NextResponse.json({
    ok: mediaValidation.valid,
    campaign: updated,
    mediaValidation,
    error: mediaValidation.valid ? undefined : mediaValidation.errors.join(' '),
  });
}
