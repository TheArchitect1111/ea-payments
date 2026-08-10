export type ReliabilityEvidence = {
  name: string;
  passed: boolean;
  detail?: string;
  source?: string;
};

export type CompletionDecision = {
  task_id: string;
  status: 'in_progress' | 'blocked' | 'finished';
  verified: boolean;
  missing_gates: string[];
  failed_gates: string[];
  blockers: string[];
  next_action: string;
};

export async function verifyAgentCompletion(input: {
  taskId: string;
  goal: string;
  claimedStatus: 'in_progress' | 'blocked' | 'finished';
  requiredGates: string[];
  evidence: ReliabilityEvidence[];
  blockers?: string[];
}): Promise<CompletionDecision> {
  const endpoint = process.env.EA_AGENT_RELIABILITY_URL?.replace(/\/$/, '');
  if (!endpoint) {
    const evidenceByName = new Map(input.evidence.map((item) => [item.name, item]));
    const missing = input.requiredGates.filter((gate) => !evidenceByName.has(gate));
    const failed = input.requiredGates.filter((gate) => evidenceByName.has(gate) && !evidenceByName.get(gate)?.passed);
    const blockers = input.blockers ?? [];
    const verified = input.claimedStatus === 'finished' && missing.length === 0 && failed.length === 0 && blockers.length === 0;
    return {
      task_id: input.taskId,
      status: verified ? 'finished' : blockers.length ? 'blocked' : 'in_progress',
      verified,
      missing_gates: missing,
      failed_gates: failed,
      blockers,
      next_action: verified ? 'No further action.' : 'Resolve missing/failed gates before reporting completion.',
    };
  }

  const response = await fetch(`${endpoint}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      task_id: input.taskId,
      goal: input.goal,
      claimed_status: input.claimedStatus,
      required_gates: input.requiredGates,
      evidence: input.evidence,
      blockers: input.blockers ?? [],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`EA reliability service returned ${response.status}`);
  return response.json() as Promise<CompletionDecision>;
}
