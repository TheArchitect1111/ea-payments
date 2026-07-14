import CheckoutSuccessClient from './CheckoutSuccessClient';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    package?: string;
    fulfillment?: string;
    session_id?: string;
  }>;
}) {
  const { type, package: packageId, fulfillment, session_id: sessionId } = await searchParams;

  return (
    <CheckoutSuccessClient
      sessionId={sessionId}
      packageId={packageId}
      fulfillment={fulfillment}
      type={type}
    />
  );
}
