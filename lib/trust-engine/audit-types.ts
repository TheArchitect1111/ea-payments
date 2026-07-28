/**
 * Shared audit input type (avoids circular imports between audit.ts and airtable store).
 */
import type {
  LegalAuditEventType,
  TrustLegalDocType,
  TrustProductId,
} from './types';

export type RecordLegalAuditInput = {
  type: LegalAuditEventType;
  userId: string;
  email?: string;
  organizationId: string;
  organizationName?: string;
  docType?: TrustLegalDocType;
  version?: string;
  productId?: TrustProductId;
  ipAddress?: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
  clientId?: string;
};
