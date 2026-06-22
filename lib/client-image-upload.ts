/** Resize/compress phone photos so multipart uploads stay under Vercel body limits. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

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

export function formatUploadSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
}

export async function prepareCaptureUpload(file: File): Promise<File> {
  if (!isImageFile(file)) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `File is ${formatUploadSize(file.size)}. Keep uploads under ${formatUploadSize(MAX_UPLOAD_BYTES)}.`,
      );
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
        `Image is still too large (${formatUploadSize(blob.size)}). Try a smaller screenshot.`,
      );
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'capture';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    if (file.size <= MAX_UPLOAD_BYTES) {
      return file;
    }
    const hint =
      /\.heic$/i.test(file.name) || file.type === 'image/heic'
        ? ' iPhone HEIC photos may need “Most Compatible” format in Settings → Camera.'
        : '';
    throw new Error(
      `Could not prepare this image (${formatUploadSize(file.size)}).${hint} Try a screenshot instead.`,
    );
  }
}
