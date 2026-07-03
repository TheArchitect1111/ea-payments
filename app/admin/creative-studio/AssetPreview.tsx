'use client';

import type { BrandProfile, CampaignAsset } from '@/lib/creative-studio/types';

type AssetPreviewProps = {
  asset: CampaignAsset;
  brand: Pick<BrandProfile, 'primaryColor' | 'secondaryColor' | 'organizationName' | 'preferredCta'>;
};

export default function AssetPreview({ asset, brand }: AssetPreviewProps) {
  const layout = asset.previewLayout ?? 'banner';
  const style = {
    '--cs-primary': brand.primaryColor,
    '--cs-secondary': brand.secondaryColor,
  } as React.CSSProperties;

  return (
    <div className={`cs-preview cs-preview-${layout}`} style={style}>
      {layout === 'flyer' ? (
        <>
          <div className="cs-preview-flyer-top">
            <span className="cs-preview-org">{brand.organizationName}</span>
            <h3>{asset.previewTitle}</h3>
          </div>
          <div className="cs-preview-flyer-body">
            <p>{asset.previewBody}</p>
            <span className="cs-preview-cta">{brand.preferredCta}</span>
          </div>
        </>
      ) : null}

      {layout === 'banner' ? (
        <>
          <span className="cs-preview-kicker">{brand.organizationName}</span>
          <h3>{asset.previewTitle}</h3>
          <p>{asset.previewBody}</p>
        </>
      ) : null}

      {layout === 'social-story' ? (
        <div className="cs-preview-story-frame">
          <span className="cs-preview-org">{brand.organizationName}</span>
          <h3>{asset.previewTitle}</h3>
          <p>{asset.previewBody}</p>
          <span className="cs-preview-swipe">Swipe up · {brand.preferredCta}</span>
        </div>
      ) : null}

      {layout === 'social-feed' ? (
        <>
          <div className="cs-preview-feed-head">
            <span className="cs-preview-avatar" aria-hidden />
            <div>
              <strong>{brand.organizationName}</strong>
              <span className="cs-preview-time">Just now</span>
            </div>
          </div>
          <p className="cs-preview-feed-copy">{asset.previewBody}</p>
        </>
      ) : null}

      {layout === 'email' ? (
        <>
          <div className="cs-preview-email-subject">Subject: {asset.previewTitle}</div>
          <div className="cs-preview-email-body">
            <p>{asset.previewBody}</p>
            <span className="cs-preview-cta">{brand.preferredCta}</span>
          </div>
        </>
      ) : null}

      {layout === 'sms' ? (
        <div className="cs-preview-sms-bubble">
          <p>{asset.previewBody}</p>
        </div>
      ) : null}

      {layout === 'document' ? (
        <>
          <h3>{asset.previewTitle}</h3>
          <p className="cs-preview-doc">{asset.previewBody}</p>
        </>
      ) : null}

      {layout === 'qr' ? (
        <div className="cs-preview-qr">
          <div className="cs-preview-qr-box" aria-hidden />
          <p>{asset.previewTitle}</p>
        </div>
      ) : null}
    </div>
  );
}
