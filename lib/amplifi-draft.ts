export type { StoryFormats as AmplifiStoryFormats } from './story-engine';
export { buildStoryFormats, buildAmplifiSocialDraft } from './story-engine';

/** Legacy shape used by capture API */
export interface AmplifiSocialDraft {
  linkedIn: string;
  shortCaption: string;
  hashtags: string[];
  email?: string;
  sms?: string;
}
