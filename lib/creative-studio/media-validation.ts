import type {
  CampaignAsset,
  MediaAsset,
  MediaValidationResult,
} from './types';

const MB = 1024 * 1024;

function aspectRatio(media: MediaAsset): number | null {
  if (!media.width || !media.height) return null;
  return media.width / media.height;
}

export function validateMediaForAsset(
  asset: CampaignAsset,
  media: MediaAsset | null,
): MediaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checkedAt = new Date().toISOString();

  if (!media) {
    return { valid: false, checkedAt, errors: ['Select media for this social post.'], warnings };
  }

  if (!media.url.startsWith('https://')) {
    errors.push('Media must use a public HTTPS URL.');
  }
  if (media.publiclyReachable === false) {
    errors.push('Media is not marked publicly reachable.');
  }
  if (!media.rightsConfirmed) {
    errors.push('Media usage rights must be confirmed.');
  }
  if (!media.rightsSource?.trim()) {
    errors.push('Record the source or owner of the media rights.');
  }
  if (media.kind === 'image' && !media.altText?.trim()) {
    errors.push('Image alternative text is required.');
  }
  if (media.kind !== 'image' && media.kind !== 'video') {
    errors.push('Social publishing requires an image or video.');
  }

  if (asset.type === 'social-instagram') {
    if (media.kind === 'image' && media.mimeType && !['image/jpeg', 'image/png'].includes(media.mimeType)) {
      errors.push('Instagram images must be JPEG or PNG.');
    }
    if (media.kind === 'video' && media.mimeType && media.mimeType !== 'video/mp4') {
      errors.push('Instagram video must be MP4.');
    }
    if (media.width && media.width < 320) {
      errors.push('Instagram media width must be at least 320 pixels.');
    }
    const ratio = aspectRatio(media);
    if (ratio && (ratio < 0.8 || ratio > 1.91)) {
      errors.push('Instagram feed media must use an aspect ratio between 4:5 and 1.91:1.');
    }
    if (media.fileSizeBytes && media.kind === 'image' && media.fileSizeBytes > 8 * MB) {
      errors.push('Instagram image exceeds the 8 MB safety limit.');
    }
  }

  if (asset.type === 'social-facebook') {
    if (media.kind === 'image' && media.width && media.width < 600) {
      errors.push('Facebook image width must be at least 600 pixels.');
    }
    if (media.fileSizeBytes && media.kind === 'image' && media.fileSizeBytes > 10 * MB) {
      errors.push('Facebook image exceeds the 10 MB safety limit.');
    }
  }

  if (!media.width || !media.height) {
    warnings.push('Dimensions were not supplied; final provider validation is still required.');
  }
  if (!media.mimeType) {
    warnings.push('MIME type was not supplied; final provider validation is still required.');
  }

  return { valid: errors.length === 0, checkedAt, errors, warnings };
}

export function socialAssetRequiresMedia(asset: CampaignAsset): boolean {
  return asset.type === 'social-instagram' || asset.type === 'social-facebook';
}
