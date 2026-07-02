/** Shared Orb SDK types — consumed by web, extension, and future Expo clients. */

export type OrbProduct =
  | 'simplifi'
  | 'amplifi'
  | 'magnifi'
  | 'pulse'
  | 'portal'
  | 'admin'
  | 'update-hub'
  | 'unknown';

export type OrbVisualState =
  | 'idle'
  | 'watching'
  | 'thinking'
  | 'alert'
  | 'listening'
  | 'speaking'
  | 'success'
  | 'warning'
  | 'celebration';

export type OrbActionKind = 'navigate' | 'capture' | 'guide' | 'voice' | 'event';

export type OrbAction = {
  id: string;
  label: string;
  kind: OrbActionKind;
  href?: string;
  event?: string;
};

export type OrbContext = {
  product: OrbProduct;
  pathname: string;
  state: OrbVisualState;
  greeting: string;
  focus: string[];
  recommendedAction: string;
  actions: OrbAction[];
};

export type OrbSessionHint = {
  slug?: string;
  email?: string;
  realm?: string;
};
