import {
  getCtpSubmissionById,
  type CtpIntakeAnalysisRecord,
} from '@/lib/ctp-submissions';
import { schedulePraisonWorkforce, runPraisonWorkforce } from '@/lib/praison-ai/orchestrator';

/** @deprecated Prefer schedulePraisonWorkforce — delegates to PraisonAI workforce. */
export async function runCtpIntakeAnalysis(
  submissionId: string,
): Promise<{ ok: boolean; error?: string; analysis?: CtpIntakeAnalysisRecord }> {
  const result = await runPraisonWorkforce(submissionId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  const submission = await getCtpSubmissionById(submissionId);
  return { ok: true, analysis: submission?.intakeAnalysis };
}

/** Fire-and-forget — never throws; safe to call from assessment submit. */
export function scheduleCtpIntakeAnalysis(submissionId: string): void {
  schedulePraisonWorkforce(submissionId);
}
