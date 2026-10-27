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

/** Customer-facing methods are not merchant processors. */
export const CUSTOMER_PAYMENT_METHODS = [
  'card', 'paypal_wallet', 'venmo', 'cash_app_pay', 'ach_bank',
] as const;
export type CustomerPaymentMethod = typeof CUSTOMER_PAYMENT_METHODS[number];

export const SUPPORTED_METHODS: Readonly<Record<PaymentProvider, readonly CustomerPaymentMethod[]>> = {
  paypal: ['card', 'paypal_wallet', 'venmo'],
  stripe: ['card', 'cash_app_pay', 'ach_bank'],
};

/** Provider capability availability is account, country and checkout dependent. */
export function canOfferCustomerMethod(
  connection: MerchantConnection | null,
  tenantId: string,
  method: CustomerPaymentMethod,
  verifiedEnabledMethods: readonly CustomerPaymentMethod[],
): boolean {
  return !!connection &&
    merchantCanTakePayments(connection, tenantId) &&
    SUPPORTED_METHODS[connection.provider].includes(method) &&
    verifiedEnabledMethods.includes(method);
}
