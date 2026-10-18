import type { Brick, BrickHealth, CheckoutNotApplicable, NonPaymentPriceContract } from '../BrickInterface';
import { loadCommsConfig, createAirtableCommsAuditTable, createCommsSender, type CommsAuditTable, type CommsAuditRow, type CommsSendResult } from './sendTemplate';
import type { VerifiedContact } from './config.schema';

export type EACommsBrickOptions = {
  portalRoot: string;
  portalId: string;
  auditTable?: CommsAuditTable;
  fetchImpl?: typeof fetch;
};

/** Standalone, non-payment variant of the shared chassis contract. */
export type EACommsBrick = Brick<
  NonPaymentPriceContract,
  CheckoutNotApplicable,
  [templateId: string, to: VerifiedContact, data: Record<string, unknown>],
  CommsSendResult
> & {
  sendTemplate(templateId: string, to: VerifiedContact, data: Record<string, unknown>): Promise<CommsSendResult>;
  getAuditLog(): Promise<CommsAuditRow[]>;
};

/** Standalone non-payment socket contract. Does not claim a payment session or entitlement. */
export function createEACommsBrick(options: EACommsBrickOptions): EACommsBrick {
  const auditTable = options.auditTable || createAirtableCommsAuditTable(options.portalId, options.fetchImpl);
  const sender = createCommsSender({ portalRoot: options.portalRoot, auditTable, fetchImpl: options.fetchImpl });
  let healthy = false;
  return {
    id: 'ea-comms-brick' as const,
    async health(): Promise<BrickHealth> {
      try {
        const config = await loadCommsConfig(options.portalRoot);
        const ready = Boolean(process.env.RESEND_API_KEY?.trim()) && config.provider === 'resend';
        healthy = ready;
        return { status: ready ? 200 : 503, evidence: ready ? 'Provider key present and all approved templates loaded' : 'Provider key missing' };
      } catch (error) {
        healthy = false;
        return { status: 503, evidence: 'Communications template registry unavailable: ' + (error instanceof Error ? error.message : String(error)) };
      }
    },
    price: () => ({ currency: 'CAD' as const, amount: 0, note: 'included with portal' as const }),
    async checkout() { return { notApplicable: true as const, reason: 'comms brick does not process payments' as const }; },
    welcome: (templateId: string, to: VerifiedContact, data: Record<string, unknown>) => sender.sendTemplate(templateId, to, data),
    sendTemplate: sender.sendTemplate,
    getAuditLog: sender.getAuditLog,
    attach: () => healthy,
  };
}

export { CommsConfigSchema, VerifiedContactSchema } from './config.schema';
export { TEMPLATE_REQUIREMENTS } from './templates';
export { createAirtableCommsAuditTable, loadCommsConfig } from './sendTemplate';
export type { CommsAuditRow, CommsAuditTable, CommsSendResult } from './sendTemplate';
