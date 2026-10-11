import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';
import { analyzeAssessment, OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
import { sendAuthEmail } from '@/lib/ea-auth-email';
export const DiscoveryConfig = z.object({ brandName: z.string().trim().min(1).max(120).default('Efficiency Architects') }).strict();
export const DiscoveryInput = z.object({ requestId: z.string().regex(/^[a-zA-Z0-9-]{8,100}$/), name: z.string().trim().min(1).max(200),
  teamSize: z.number().int().min(1).max(100000), revenueRange: z.enum(['under_100k','100k_500k','500k_1m','1m_5m','5m_plus']),
  systemsCount: z.number().int().min(0).max(100), operationalChallenges: z.array(z.string()).max(15)
    .refine(xs => xs.every(x => OPERATIONAL_CHALLENGES.some(c => c.id === x)), 'Unknown challenge'),
  complexity: z.enum(['low','medium','high']), goals: z.string().trim().max(4000).default('') }).strict();
type Data = z.infer<typeof DiscoveryInput>;
export type DiscoveryRow = BrickTenant & { id: string; email: string; input: Data; analysis: ReturnType<typeof analyzeAssessment>; confirmationSent: boolean };
const installKey = (t: BrickTenant) => 'discovery-install-' + brickHash(t.organizationId);
export async function installDiscovery(tenant: BrickTenant, input: unknown = {}) {
  const config = DiscoveryConfig.parse(input);
  await writeBrickRecord(tenant, installKey(tenant), { ...tenant, version: 2 as const, config });
}
export async function loadDiscoveryInstall(tenant: BrickTenant) {
  const row = await readBrickRecord<BrickTenant & {version: number;config: unknown}>(tenant, installKey(tenant));
  if (!row || row.version !== 2) throw new Error('Discovery is not installed');
  return DiscoveryConfig.parse(row.config);
}
const escape = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export async function handleDiscoverySubmit(tenant: BrickTenant, email: string, input: unknown,
  confirm: typeof sendAuthEmail = sendAuthEmail) {
  const config = await loadDiscoveryInstall(tenant);
  const data = DiscoveryInput.parse(input);
  const actorEmail = z.string().trim().email().transform(x => x.toLowerCase()).parse(email);
  const id = brickHash([tenant.organizationId, actorEmail, data.requestId]);
  const key = 'discovery-submission-' + id;
  let row = await readBrickRecord<DiscoveryRow>(tenant, key);
  if (row && JSON.stringify(row.input) !== JSON.stringify(data)) throw new Error('Conflicting submission replay');
  row ??= { ...tenant, id, email: actorEmail, input: data, analysis: analyzeAssessment(data), confirmationSent: false };
  await writeBrickRecord(tenant, key, row);
  await writeBrickRecord(tenant, 'discovery-tracking-' + id, { ...tenant, submissionId: id, eventType: 'assessment_submitted' });
  if (!row.confirmationSent) {
    const sent = await confirm({ to: actorEmail, subject: 'Your assessment is saved', title: 'Thank you for sharing your goals', brandLabel: config.brandName,
      bodyHtml: `<p>Hello ${escape(data.name)},</p><p>Your assessment is safely saved. Your capacity score is ${row.analysis.capacityScore}. We will use your answers to guide your next steps.</p>` });
    if (!sent.ok) throw new Error('Assessment saved; confirmation delivery unavailable. Retry the same submission.');
    row = await writeBrickRecord(tenant, key, { ...row, confirmationSent: true });
  }
  await writeBrickRecord(tenant, 'discovery-confirmation-' + id, { ...tenant, submissionId: id, eventType: 'confirmation_sent' });
  return row;
}
