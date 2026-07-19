import type { CtpAdminAssetView } from '@/lib/ctp-admin-view';
import { GOLD, NAVY } from '@/lib/design-system';

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalCtpAssetGallery({
  assets,
  experienceMode = false,
}: {
  assets: CtpAdminAssetView[];
  experienceMode?: boolean;
}) {
  if (!assets.length) return null;

  if (experienceMode) {
    return (
      <div style={{ marginTop: '2rem' }}>
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: GOLD,
          }}
        >
          Materials you&apos;ve shared
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--cex-muted, #5c6470)' }}>
          Files from discovery — ready for our team and studio work.
        </p>
        <div
          style={{
            display: 'grid',
            gap: '0.85rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {assets.map((asset) => (
            <article
              key={asset.id}
              style={{
                borderTop: '1px solid rgba(27, 43, 77, 0.12)',
                padding: '0.85rem 0',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: GOLD,
                }}
              >
                {asset.label}
              </p>
              <p
                style={{
                  margin: '0.35rem 0 0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: NAVY,
                  wordBreak: 'break-word',
                }}
              >
                {asset.fileName}
              </p>
              {asset.isImage ? (
                <a href={asset.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '0.65rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.fileName}
                    style={{
                      width: '100%',
                      maxHeight: '7rem',
                      objectFit: 'contain',
                      backgroundColor: 'rgba(27, 43, 77, 0.04)',
                    }}
                  />
                </a>
              ) : null}
              <div
                style={{
                  marginTop: '0.65rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--cex-muted, #5c6470)' }}>
                  {formatFileSize(asset.size)}
                </span>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: GOLD,
                  }}
                >
                  Open
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ep-module-card" style={{ marginTop: '1.25rem' }}>
      <p
        style={{
          margin: '0 0 0.75rem',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(216,173,61,0.85)',
        }}
      >
        Your discovery assets
      </p>
      <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
        Files you shared during discovery — available for your review team and studio work.
      </p>
      <div
        style={{
          display: 'grid',
          gap: '0.85rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        {assets.map((asset) => (
          <article
            key={asset.id}
            style={{
              border: '1px solid rgba(216,173,61,0.22)',
              borderRadius: '0.85rem',
              backgroundColor: 'rgba(255,255,255,0.04)',
              padding: '0.85rem',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(216,173,61,0.8)',
              }}
            >
              {asset.label}
            </p>
            <p
              style={{
                margin: '0.35rem 0 0',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#fff',
                wordBreak: 'break-word',
              }}
            >
              {asset.fileName}
            </p>
            {asset.isImage ? (
              <a href={asset.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '0.65rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.fileName}
                  style={{
                    width: '100%',
                    maxHeight: '7rem',
                    objectFit: 'contain',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(0,0,0,0.25)',
                  }}
                />
              </a>
            ) : null}
            <div
              style={{
                marginTop: '0.65rem',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                {formatFileSize(asset.size)}
              </span>
              <a
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: GOLD,
                }}
              >
                Open
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
