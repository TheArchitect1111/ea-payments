/**
 * Reusable EA payment-onboarding brick contract.
 *
 * Every tenant owns its merchant relationship. Never copy EA billing secrets
 * or another tenant's credentials into this record.
 */
export const PAYMENT_PROVIDERS = ['paypal', 'stripe'] as const;
export type PaymentProvider = typeof PAYMENT_PROVIDERS[number];
export type MerchantConnectionStatus =
  | 'not_connected'
  | 'setup_required'
  | 'pending_provider'
  | 'verification_required'
  | 'ready'
  | 'restricted';

export type MerchantConnection = {
  tenantId: string;
  provider: PaymentProvider;
  status: MerchantConnectionStatus;
  providerMerchantReference: string | null;
  verifiedAt: string | null;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
};

export function merchantCanTakePayments(
  connection: MerchantConnection | null,
  tenantId: string,
): boolean {
  return !!connection
    && !!tenantId
    && connection.tenantId === tenantId
    && connection.status === 'ready'
    && connection.chargesEnabled
    && connection.payoutsEnabled
    && !!connection.providerMerchantReference
    && !!connection.verifiedAt;
}

export function selectMerchantConnection(
  connections: readonly MerchantConnection[],
  tenantId: string,
  provider: PaymentProvider,
): MerchantConnection | null {
  return connections.find(connection =>
    connection.tenantId === tenantId && connection.provider === provider
  ) ?? null;
}
