/**
 * Brick OS lifecycle tags (Capture → Organize → Communicate → Act → Measure).
 * Kept tiny and dependency-free so experience-registry and the OS taxonomy
 * can share it without circular imports.
 */
export const OS_LIFECYCLE_TAGS = [
  'capture',
  'organize',
  'communicate',
  'act',
  'measure',
] as const;

export type OsLifecycleTag = (typeof OS_LIFECYCLE_TAGS)[number];
