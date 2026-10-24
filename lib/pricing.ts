// Amplifi by EA - DBA Ascension Systems, LLC
// Pricing: $49 $99 $199 monthly, Stripe 2.9% + 30c
// Net: $49 -> $47.28, $99 -> $95.83, $199 -> $192.93
// Guarantee: You control, nothing posts without Yes, redo any, cancel anytime no refund keep access till end
// Support: support@efficiencyarchitects.online alias to freedom@efficiencyarchitects.online via Private Email

export const PRICING = {
  starter: { price: 49, net: 47.28, priceId: process.env.STRIPE_PRICE_STARTER_49 || 'price_starter_49', name: 'Starter' },
  growth: { price: 99, net: 95.83, priceId: process.env.STRIPE_PRICE_GROWTH_99 || 'price_growth_99', name: 'Growth' },
  scale: { price: 199, net: 192.93, priceId: process.env.STRIPE_PRICE_SCALE_199 || 'price_scale_199', name: 'Scale' },
};

export const DBA = 'Amplifi by EA, a DBA of Ascension Systems, LLC';
export const SUPPORT = 'support@efficiencyarchitects.online';
export const PRIMARY_EMAIL = 'freedom@efficiencyarchitects.online';
