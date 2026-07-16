/**
 * Shared Simplifi/capture upload limits — client and server must agree.
 * Kept under Vercel ~4.5MB body limit with base64 headroom.
 */

export const MAX_CAPTURE_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export const MAX_CAPTURE_DIMENSION = 1920;

export function formatCaptureUploadSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function captureUploadTooLargeMessage(bytes: number): string {
  return `File is ${formatCaptureUploadSize(bytes)}. Keep uploads under ${formatCaptureUploadSize(MAX_CAPTURE_UPLOAD_BYTES)}.`;
}

export function assertCaptureUploadSize(bytes: number): void {
  if (bytes > MAX_CAPTURE_UPLOAD_BYTES) {
    throw new Error(captureUploadTooLargeMessage(bytes));
  }
}

const PROCESSING_KEY = 'simplifi:processingCaptureId';
const GUEST_CAPTURE_IDS_KEY = 'simplifi:guestCaptureIds';

export function stashProcessingCaptureId(captureId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROCESSING_KEY, captureId);
  } catch {
    // ignore quota
  }
}

export function readProcessingCaptureId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(PROCESSING_KEY);
  } catch {
    return null;
  }
}

export function clearProcessingCaptureId(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PROCESSING_KEY);
  } catch {
    // ignore
  }
}

export function rememberGuestCaptureId(captureId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(GUEST_CAPTURE_IDS_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [captureId, ...list.filter((id) => id !== captureId)].slice(0, 20);
    sessionStorage.setItem(GUEST_CAPTURE_IDS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function readGuestCaptureIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(GUEST_CAPTURE_IDS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function clearGuestCaptureIds(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(GUEST_CAPTURE_IDS_KEY);
  } catch {
    // ignore
  }
}
