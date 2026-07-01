import * as react from 'react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

/** EA Instant Feel Standard™ — animation timing (ms) */
declare const eaMotion: {
    readonly tap: 120;
    readonly small: 180;
    readonly menu: 220;
    readonly page: 300;
    readonly large: 400;
};
type EAMotionDuration = keyof typeof eaMotion;

type OptimisticSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type Options = {
    /** How long the "Saved" badge stays visible */
    savedMs?: number;
};
declare function useOptimisticSave(options?: Options): {
    status: OptimisticSaveStatus;
    error: string;
    run: <T>(work: () => Promise<T>, onOptimistic?: () => void) => Promise<T | undefined>;
    reset: () => void;
};

type Props$3 = {
    status: OptimisticSaveStatus;
    error?: string;
    className?: string;
};
declare function OptimisticSaveBadge({ status, error, className }: Props$3): react.JSX.Element | null;

type Props$2 = {
    lines?: number;
    className?: string;
};
declare function SkeletonBlock({ lines, className }: Props$2): react.JSX.Element;

type Props$1 = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    glow?: boolean;
};
declare function InstantFeelButton({ children, variant, glow, className, type, ...rest }: Props$1): react.JSX.Element;

type Props = {
    label: string;
    className?: string;
};
/** Small momentum indicator — "something is happening" without blocking UI */
declare function ProgressMomentum({ label, className }: Props): react.JSX.Element;

export { type EAMotionDuration, InstantFeelButton, OptimisticSaveBadge, type OptimisticSaveStatus, ProgressMomentum, SkeletonBlock, eaMotion, useOptimisticSave };
