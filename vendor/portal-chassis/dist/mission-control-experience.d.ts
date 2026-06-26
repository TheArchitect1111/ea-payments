import * as react from 'react';
import { MissionControlResponse } from './mission-control.js';
export { UniversalBriefCard, UniversalBriefCardProps } from './brief-experience.js';
import './brief.js';
import './activity.js';
import './airtable.js';
import './platform-events.js';
import './agents.js';

interface MissionControlExperienceProps {
    mission: MissionControlResponse;
    /** Called when user submits intent from the command bar (wire to EA Voice / orchestrator). */
    onIntentSubmit?: (intent: string) => void;
    /** Operating mode — affects which action cards are shown (filtered server-side too). */
    mode?: 'executive' | 'builder';
}
declare function MissionControlExperience({ mission, onIntentSubmit, mode, }: MissionControlExperienceProps): react.JSX.Element;

export { MissionControlExperience, type MissionControlExperienceProps };
