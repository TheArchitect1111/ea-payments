/**
 * Face/focal MediaPipe worker stub.
 * Isolated from page render. Enable with ECE_FACE_FOCAL_ENABLED=1 and install
 * @mediapipe/tasks-vision when running this worker in a capable environment.
 *
 * Run: npx --yes tsx scripts/ece-face-focal-worker.ts
 */
import {
  analyzeFacesWithMediaPipe,
  cropHintsFromFaces,
  classifyPhotograph,
} from '../lib/experience-creation/face-focal';

const FIXTURE_CASES = [
  { name: 'single-portrait', faces: [{ xMin: 0.35, yMin: 0.12, width: 0.28, height: 0.4, score: 0.95 }] },
  {
    name: 'two-person',
    faces: [
      { xMin: 0.2, yMin: 0.15, width: 0.22, height: 0.35, score: 0.9 },
      { xMin: 0.55, yMin: 0.18, width: 0.22, height: 0.35, score: 0.88 },
    ],
  },
  {
    name: 'large-group',
    faces: Array.from({ length: 6 }, (_, i) => ({
      xMin: 0.08 + (i % 3) * 0.28,
      yMin: 0.2 + Math.floor(i / 3) * 0.28,
      width: 0.18,
      height: 0.22,
      score: 0.8,
    })),
  },
  { name: 'no-people', faces: [] as Array<{ xMin: number; yMin: number; width: number; height: number; score: number }> },
  {
    name: 'landscape-event',
    faces: [
      { xMin: 0.15, yMin: 0.35, width: 0.1, height: 0.15, score: 0.7 },
      { xMin: 0.45, yMin: 0.4, width: 0.1, height: 0.14, score: 0.65 },
      { xMin: 0.7, yMin: 0.38, width: 0.1, height: 0.15, score: 0.6 },
    ],
  },
];

async function main() {
  const live = await analyzeFacesWithMediaPipe({
    imageUrl: 'https://api.openverse.org/v1/images/',
  });

  const fixtures = FIXTURE_CASES.map((c) => {
    const hints = cropHintsFromFaces(c.faces);
    return {
      name: c.name,
      photographType: classifyPhotograph(c.faces.length),
      faceCount: c.faces.length,
      cropHints: hints,
      // Ensure no face center falls outside safe region for mobile/desktop
      facesInsideSafe: c.faces.every((f) => {
        const safe = hints[0]!.safeRegion;
        const cx = f.xMin + f.width / 2;
        const cy = f.yMin + f.height / 2;
        return (
          cx >= safe.x &&
          cx <= safe.x + safe.width &&
          cy >= safe.y &&
          cy <= safe.y + safe.height
        );
      }),
    };
  });

  console.log(
    JSON.stringify(
      {
        mediapipeLiveStatus: live.status,
        mediapipeError: live.error,
        note: 'Full MediaPipe WASM bootstrap remains worker-only; fixtures prove crop math.',
        fixtures,
      },
      null,
      2,
    ),
  );
}

void main();
