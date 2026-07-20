/** Resize/compress phone photos so multipart uploads stay under Vercel body limits. */
import {
  MAX_CAPTURE_DIMENSION,
  MAX_CAPTURE_UPLOAD_BYTES,
  formatCaptureUploadSize,
} from '@/lib/capture-upload-limits';

const MAX_UPLOAD_BYTES = MAX_CAPTURE_UPLOAD_BYTES;
const MAX_DIMENSION = MAX_CAPTURE_DIMENSION;
const JPEG_QUALITY = 0.82;

const HEIC_CONVERT_FAIL =
  'Could not convert this iPhone HEIC photo. Save as JPEG or take a screenshot, then try again.';

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

export function isHeicCaptureFile(file: File): boolean {
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name) || /heic|heif/i.test(file.type);
}

function jpegFileFromBlob(blob: Blob, sourceName: string): File {
  const baseName = sourceName.replace(/\.[^.]+$/, '') || 'capture';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

async function bitmapToJpegFile(bitmap: ImageBitmap, sourceName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(HEIC_CONVERT_FAIL);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvasToJpegBlob(canvas, 0.92);
  return jpegFileFromBlob(blob, sourceName);
}

/** Convert HEIC/HEIF to JPEG in the browser before compress/upload. */
async function convertHeicToJpeg(file: File): Promise<File> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return await bitmapToJpegFile(bitmap, file.name);
    } catch {
      // Browser cannot decode HEIC — fall through to heic2any.
    }
  }

  try {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    if (!(blob instanceof Blob)) throw new Error(HEIC_CONVERT_FAIL);
    return jpegFileFromBlob(blob, file.name);
  } catch (err) {
    if (err instanceof Error && err.message === HEIC_CONVERT_FAIL) throw err;
    throw new Error(HEIC_CONVERT_FAIL);
  }
}

export async function prepareCaptureUpload(file: File): Promise<File> {
  let working = file;

  if (isHeicCaptureFile(file)) {
    working = await convertHeicToJpeg(file);
  }

  if (!isImageFile(working)) {
    if (working.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `File is ${formatCaptureUploadSize(working.size)}. Keep uploads under ${formatCaptureUploadSize(MAX_UPLOAD_BYTES)}.`,
      );
    }
    if (/\.pdf$/i.test(working.name) || working.type === 'application/pdf') {
      // PDF accepted under size cap — no compress path
      return working;
    }
    return working;
  }

  if (working.size <= MAX_UPLOAD_BYTES && (working.type === 'image/jpeg' || working.type === 'image/webp')) {
    return working;
  }

  try {
    const img = await loadImageFromFile(working);
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

    return jpegFileFromBlob(blob, working.name);
  } catch (err) {
    if (
      err instanceof Error &&
      /HEIC|screenshot|still too large|File is |Could not convert/i.test(err.message)
    ) {
      throw err;
    }
    if (working.size <= MAX_UPLOAD_BYTES) {
      return working;
    }
    throw new Error(
      `Could not prepare this image (${formatCaptureUploadSize(working.size)}). Try a screenshot instead.`,
    );
  }
}
