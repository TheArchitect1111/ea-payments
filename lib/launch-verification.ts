/** EA Launch Verification — $1 production payment smoke test product. */

export const LAUNCH_VERIFICATION_PACKAGE_ID = 'launch_verification' as const;

export const LAUNCH_VERIFICATION_PRODUCT_NAME = 'EA Launch Verification';

export const LAUNCH_VERIFICATION_AIRTABLE_PACKAGE = 'Launch Verification' as const;

export const LAUNCH_VERIFICATION_ONBOARDING_STATUS = 'Launch Verification' as const;

export const LAUNCH_VERIFICATION_PRICE_CENTS = 100;

export const LAUNCH_VERIFICATION_STRIPE_PRICE_ENV = 'STRIPE_PRICE_LAUNCH_VERIFICATION';

export const LAUNCH_VERIFICATION_CHECKOUT_PATH = '/launch-verification';

export const LAUNCH_VERIFICATION_SUCCESS_PATH = '/launch-verification/success';

export const LAUNCH_VERIFICATION_CANCEL_PATH = '/launch-verification/cancel';

export function isLaunchVerificationPackageId(id: string | undefined): boolean {
  return id?.trim() === LAUNCH_VERIFICATION_PACKAGE_ID;
}

export function isLaunchVerificationSession(meta: Record<string, string | undefined>): boolean {
  return (
    isLaunchVerificationPackageId(meta.packageId) ||
    meta.flow === 'launch_verification' ||
    meta.packageName === LAUNCH_VERIFICATION_AIRTABLE_PACKAGE
  );
}
