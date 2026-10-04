// Stub that satisfies app/amanda-catherine/page.tsx import
// Original file missing in repo, config.ts exists
export async function getAmandaSiteContent() {
  return {
    contact: {
      bookingUrl: process.env.AMANDA_JANE_BOOKING_URL || 'https://aesthetikine.janeapp.com/#/discipline/1/treatment/2',
      email: 'Amanda@aesthetikine.com',
      phone: '226-581-2003'
    }
  };
}
