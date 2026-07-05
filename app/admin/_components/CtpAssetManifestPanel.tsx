'use client';

import type { CtpAdminAssetView } from '@/lib/ctp-admin-view';

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CtpAssetManifestPanel({
  assets,
  compact = false,
  emptyMessage = 'No discovery assets uploaded for this submission.',
}: {
  assets: CtpAdminAssetView[];
  compact?: boolean;
  emptyMessage?: string;
}) {
  if (!assets.length) {
    return (
      <p className="text-sm text-neutral-500">{emptyMessage}</p>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
      {assets.map((asset) => (
        <article key={asset.id} className="border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{asset.label}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-800 break-all">{asset.fileName}</p>
            </div>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-bold uppercase tracking-wider text-blue-700 hover:text-blue-900"
            >
              Open
            </a>
          </div>

          {asset.isImage ? (
            <a href={asset.url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded border border-neutral-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.fileName}
                className={`w-full object-contain ${compact ? 'max-h-28' : 'max-h-40'}`}
              />
            </a>
          ) : null}

          <p className="mt-2 text-xs text-neutral-500">
            {formatFileSize(asset.size)} · {formatDate(asset.uploadedAt)}
          </p>
        </article>
      ))}
    </div>
  );
}
