import CheckoutSuccessClient from './CheckoutSuccessClient';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    package?: string;
    fulfillment?: string;
    session_id?: string;
    plan?: string;
  }>;
}) {
  const {
    type,
    package: packageId,
    fulfillment,
    session_id: sessionId,
    plan,
  } = await searchParams;

  return (
    <CheckoutSuccessClient
      sessionId={sessionId}
      packageId={packageId}
      fulfillment={fulfillment}
      type={type}
      planId={plan}
    />
  );
}
