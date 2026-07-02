export type ConnectNurtureRunLog = {
  at: string;
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
  trigger: 'cron' | 'admin-verify';
};

const HISTORY_CAP = 20;
const history: ConnectNurtureRunLog[] = [];

export function recordConnectNurtureRun(
  result: Omit<ConnectNurtureRunLog, 'at'> & { at?: string },
): ConnectNurtureRunLog {
  const entry: ConnectNurtureRunLog = {
    ...result,
    at: result.at ?? new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > HISTORY_CAP) history.length = HISTORY_CAP;
  return entry;
}

export function getConnectNurtureRunStatus(): {
  lastRun: ConnectNurtureRunLog | null;
  recentRuns: ConnectNurtureRunLog[];
} {
  return {
    lastRun: history[0] ?? null,
    recentRuns: history.slice(0, 5),
  };
}
