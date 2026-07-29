/**
 * Face + focal-point analysis for Experience Creation Engine.
 *
 * Uses Google MediaPipe Face Detector when ECE_FACE_FOCAL_ENABLED=1 and
 * @mediapipe/tasks-vision is available. Otherwise records pending/blocked
 * analysis — never invents faces, never performs identity recognition.
 *
 * Runs outside latency-sensitive page rendering.
 */
export type FaceBox = {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
  score: number;
};

export type FocalCropHint = {
  viewport: 'landscape_hero' | 'portrait_hero' | 'square_card' | 'wide_banner' | 'mobile_crop';
  /** CSS object-position percentages */
  objectPosition: string;
  focalPoint: { x: number; y: number };
  safeRegion: { x: number; y: number; width: number; height: number };
};

export type FaceFocalAnalysis = {
  status: 'complete' | 'pending' | 'blocked' | 'skipped_no_image' | 'failed';
  provider: 'mediapipe-face-detector' | 'geometry-fallback' | 'none';
  faceCount: number;
  faces: FaceBox[];
  photographType: 'portrait' | 'group' | 'no_people' | 'unknown';
  cropHints: FocalCropHint[];
  error?: string;
  analyzedAt: string;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function objectPositionFromFocal(x: number, y: number): string {
  return `${Math.round(clamp01(x) * 100)}% ${Math.round(clamp01(y) * 100)}%`;
}

function unionSafeRegion(faces: FaceBox[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (!faces.length) {
    return { x: 0.15, y: 0.1, width: 0.7, height: 0.8 };
  }
  let x0 = 1;
  let y0 = 1;
  let x1 = 0;
  let y1 = 0;
  for (const f of faces) {
    x0 = Math.min(x0, f.xMin);
    y0 = Math.min(y0, f.yMin);
    x1 = Math.max(x1, f.xMin + f.width);
    y1 = Math.max(y1, f.yMin + f.height);
  }
  // Pad so heads are not cropped
  const padX = 0.08;
  const padY = 0.12;
  const x = clamp01(x0 - padX);
  const y = clamp01(y0 - padY);
  const width = clamp01(x1 + padX) - x;
  const height = clamp01(y1 + padY) - y;
  return { x, y, width: Math.max(width, 0.2), height: Math.max(height, 0.2) };
}

export function cropHintsFromFaces(faces: FaceBox[]): FocalCropHint[] {
  const safe = unionSafeRegion(faces);
  const cx = faces.length
    ? faces.reduce((s, f) => s + f.xMin + f.width / 2, 0) / faces.length
    : 0.5;
  // Prefer slightly above center for portraits (headroom)
  const cy = faces.length
    ? faces.reduce((s, f) => s + f.yMin + f.height / 2, 0) / faces.length - 0.05
    : 0.42;
  const focal = { x: clamp01(cx), y: clamp01(cy) };
  const pos = objectPositionFromFocal(focal.x, focal.y);

  const viewports: FocalCropHint['viewport'][] = [
    'landscape_hero',
    'portrait_hero',
    'square_card',
    'wide_banner',
    'mobile_crop',
  ];

  return viewports.map((viewport) => {
    let focalAdj = { ...focal };
    if (viewport === 'mobile_crop' || viewport === 'portrait_hero') {
      focalAdj = { x: focal.x, y: clamp01(focal.y - 0.02) };
    }
    if (viewport === 'wide_banner') {
      focalAdj = { x: focal.x, y: clamp01(focal.y + 0.02) };
    }
    return {
      viewport,
      objectPosition: objectPositionFromFocal(focalAdj.x, focalAdj.y),
      focalPoint: focalAdj,
      safeRegion: safe,
    };
  });
}

export function classifyPhotograph(faceCount: number): FaceFocalAnalysis['photographType'] {
  if (faceCount <= 0) return 'no_people';
  if (faceCount === 1) return 'portrait';
  if (faceCount >= 3) return 'group';
  return 'group';
}

/**
 * Geometry-only hints when MediaPipe is unavailable.
 * Does NOT claim faces were detected.
 */
export function geometryFocalFallback(): FaceFocalAnalysis {
  const faces: FaceBox[] = [];
  return {
    status: 'pending',
    provider: 'geometry-fallback',
    faceCount: 0,
    faces,
    photographType: 'unknown',
    cropHints: cropHintsFromFaces([
      // Assume subject in upper-center until MediaPipe runs
      { xMin: 0.3, yMin: 0.15, width: 0.4, height: 0.45, score: 0 },
    ]),
    error: 'MediaPipe not enabled — geometric crop hints only; faces not detected.',
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Attempt MediaPipe Face Detector via dynamic import.
 * Returns blocked/pending when package or WASM is unavailable (typical on Vercel page path).
 */
export async function analyzeFacesWithMediaPipe(_input: {
  imageUrl?: string;
  imageBytes?: Uint8Array;
}): Promise<FaceFocalAnalysis> {
  if (process.env.ECE_FACE_FOCAL_ENABLED !== '1') {
    return {
      ...geometryFocalFallback(),
      status: 'pending',
      provider: 'none',
      error: 'ECE_FACE_FOCAL_ENABLED is not set — face detection deferred to media worker.',
    };
  }

  try {
    // Optional dependency — do not hard-require at build time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(
      /* webpackIgnore: true */ '@mediapipe/tasks-vision' as string
    ).catch(() => null);
    if (!mod) {
      return {
        status: 'blocked',
        provider: 'mediapipe-face-detector',
        faceCount: 0,
        faces: [],
        photographType: 'unknown',
        cropHints: cropHintsFromFaces([]),
        error:
          'BLOCKED_PROVIDER: @mediapipe/tasks-vision is not installed. Run face-focal worker with the package present.',
        analyzedAt: new Date().toISOString(),
      };
    }

    // Full WASM FaceDetector init is environment-specific (Node canvas / browser).
    // Until the isolated worker wires FilesetResolver + model path, mark blocked clearly.
    return {
      status: 'blocked',
      provider: 'mediapipe-face-detector',
      faceCount: 0,
      faces: [],
      photographType: 'unknown',
      cropHints: cropHintsFromFaces([]),
      error:
        'BLOCKED_PROVIDER: MediaPipe Face Detector package present but isolated worker model bootstrap is required (not run in page render path).',
      analyzedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: 'failed',
      provider: 'mediapipe-face-detector',
      faceCount: 0,
      faces: [],
      photographType: 'unknown',
      cropHints: cropHintsFromFaces([]),
      error: err instanceof Error ? err.message : 'Face analysis failed',
      analyzedAt: new Date().toISOString(),
    };
  }
}

/** Apply analysis onto asset-facing focal fields. */
export function focalPointFromAnalysis(analysis: FaceFocalAnalysis): {
  x: number;
  y: number;
} {
  const hint =
    analysis.cropHints.find((h) => h.viewport === 'landscape_hero') || analysis.cropHints[0];
  return hint?.focalPoint || { x: 0.5, y: 0.4 };
}
