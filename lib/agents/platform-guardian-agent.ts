import type { AIRequestContext } from '@/lib/ai/types';
import {
  guardianResultToAgentExecution,
  runPlatformGuardianAudit,
} from '@/lib/platform-guardian';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

const GUARDIAN_CAPABILITIES = [
  'platform health monitoring',
  'failure detection',
  'ops audit',
  'launch readiness review',
  'backup verification',
  'daily executive brief',
  'root cause analysis',
  'reliability recommendations',
];

export const platformGuardianAgent: EAAgent = {
  name: 'platform-guardian',
  description:
    'Platform Guardian™ — continuous ops monitoring, failure detection, backup checks, and executive reliability briefs.',
  capabilities: GUARDIAN_CAPABILITIES,
  permissions: [
    { id: 'read_ops_health', description: 'Read launch command center and ops health signals.' },
    { id: 'send_guardian_brief', description: 'Send daily executive brief when Resend is configured.' },
  ],
  status() {
    return 'available';
  },
  async health(): Promise<AgentHealth> {
    const backupConfigured = Boolean(process.env.BACKUP_DESTINATION_URI?.trim());
    const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
    return {
      name: 'platform-guardian',
      status: 'available',
      checkedAt: new Date().toISOString(),
      details: `Ops agent active. Sentry: ${sentryConfigured ? 'yes' : 'no'}. Backup URI: ${backupConfigured ? 'yes' : 'no'}.`,
    };
  },
  async execute(
    input: AgentExecutionInput,
    _context: AIRequestContext,
  ): Promise<AgentExecutionResult> {
    const sendBrief =
      input.context?.sendDailyBrief === true ||
      /daily brief|send email|executive brief/i.test(input.query);

    const report = await runPlatformGuardianAudit({
      probeRoutes: input.context?.probeRoutes === true,
      sendDailyBrief: sendBrief,
    });

    return guardianResultToAgentExecution(report);
  },
};
