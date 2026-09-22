function assert(value, message) { if (!value) throw new Error(message); }

/**
 * Creates a durable logical asset reference for a file persisted in the
 * EA Factory Assets Dropbox folder. Runtime download URLs are intentionally
 * not stored because Dropbox temporary links expire and are single-use.
 */
export function createDropboxAssetReference({ fileId, path, contentHash, filename } = {}) {
  assert(fileId?.startsWith('id:'), 'Dropbox fileId required');
  assert(path, 'Dropbox namespace path required');
  return {
    provider: 'dropbox',
    fileId,
    path,
    filename: filename || path.split('/').pop(),
    contentHash: contentHash || null,
    immutable: true,
    purpose: 'ea-visual-reference',
    resolver: 'DROPBOX_TEMP_DOWNLOAD_AT_EXECUTION'
  };
}

export function toFactoryAssetRef(asset) {
  assert(asset?.provider === 'dropbox' && asset?.fileId, 'Dropbox asset required');
  return `dropbox://${asset.fileId}`;
}
