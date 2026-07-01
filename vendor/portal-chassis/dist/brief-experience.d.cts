import * as react from 'react';
import { BriefCard, BriefResponse, BriefAction } from './brief.cjs';
import './activity.cjs';
import './airtable.cjs';

interface BriefExperienceProps {
    brief: BriefResponse;
    moduleName?: string;
}
declare function BriefExperience({ brief, moduleName }: BriefExperienceProps): react.JSX.Element;
interface UniversalBriefCardProps {
    card: BriefCard;
    emphasis?: "primary" | "default";
}
declare function UniversalBriefCard({ card, emphasis }: UniversalBriefCardProps): react.JSX.Element;
declare function ActivityTimeline({ cards }: {
    cards: BriefCard[];
}): react.JSX.Element;
declare function QuickActions({ actions }: {
    actions: BriefAction[];
}): react.JSX.Element | null;

export { ActivityTimeline, BriefExperience, type BriefExperienceProps, QuickActions, UniversalBriefCard, type UniversalBriefCardProps };
