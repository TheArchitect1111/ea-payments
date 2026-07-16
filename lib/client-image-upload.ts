/** Resize/compress phone photos so multipart uploads stay under Vercel body limits. */
import {
  MAX_CAPTURE_DIMENSION,
  MAX_CAPTURE_UPLOAD_BYTES,
  formatCaptureUploadSize,
} from '@/lib/capture-upload-limits';

const MAX_UPLOAD_BYTES = MAX_CAPTURE_UPLOAD_BYTES;
const MAX_DIMENSION = MAX_CAPTURE_DIMENSION;
const JPEG_QUALITY = 0.82;

export { formatCaptureUploadSize as formatUploadSize, MAX_CAPTURE_UPLOAD_BYTES };

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

function isHeic(file: File): boolean {
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name) || /heic|heif/i.test(file.type);
}

export async function prepareCaptureUpload(file: File): Promise<File> {
  if (isHeic(file)) {
    throw new Error(
      'iPhone HEIC photos are not supported here. In Settings → Camera → Formats, choose “Most Compatible,” or upload a screenshot instead.',
    );
  }

  if (!isImageFile(file)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `File is ${formatCaptureUploadSize(file.size)}. Keep uploads under ${formatCaptureUploadSize(MAX_UPLOAD_BYTES)}.`,
      );
    }
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
      // PDF accepted under size cap — no compress path
      return file;
    }
    return file;
  }

  if (file.size <= MAX_UPLOAD_BYTES && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  try {
    const img = await loadImageFromFile(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not prepare image for upload.');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = JPEG_QUALITY;
    let blob = await canvasToJpegBlob(canvas, quality);

    while (blob.size > MAX_UPLOAD_BYTES && quality > 0.45) {
      quality -= 0.08;
      blob = await canvasToJpegBlob(canvas, quality);
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `Image is still too large (${formatCaptureUploadSize(blob.size)}). Try a smaller screenshot.`,
      );
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'capture';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    if (err instanceof Error && /HEIC|Most Compatible|still too large|File is /.test(err.message)) {
      throw err;
    }
    if (file.size <= MAX_UPLOAD_BYTES) {
      return file;
    }
    throw new Error(
      `Could not prepare this image (${formatCaptureUploadSize(file.size)}). Try a screenshot instead.`,
    );
  }
}
