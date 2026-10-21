# TB3.ONLINE FULL SYSTEM AUDIT - All Workflows

## 1. PUBLIC WEBSITE - /tarris
- [ ] Loads at tb3.online/tarris - 200
- [ ] 15 official images load
- [ ] 5 films load
- [ ] About / Story / Future CTAs work
- [ ] Merch store link - WHERE DOES IT GO? Functional?
- [ ] Mobile responsive

## 2. BOOKING - /tarris/book
- [ ] Page loads 200
- [ ] Booking form submits
- [ ] Email / calendar event creates
- [ ] Confirmation sent

## 3. FUTURE AGREEMENT - /tarris/future/agreement
- [ ] Loads PUBLIC (should be 200, currently 307 - BUG)
- [ ] Agreement text: $2,997 / $500 deposit / $2,497 balance / $99/yr / 20%
- [ ] Sign button goes to /sign

## 4. E-SIGNATURE - /tarris/future/sign
- [ ] Loads PUBLIC (should be 200, currently 307 - BUG)
- [ ] Tarris can type/draw signature
- [ ] Checkbox for agreement
- [ ] Submit button works
- [ ] Saves to Airtable - CHECK AIRTABLE RECORD CREATED
- [ ] Redirects to /pay/tarris-bouie after sign

## 5. PAYMENT - /pay/tarris-bouie
- [ ] Page loads
- [ ] Stripe checkout loads
- [ ] $500 deposit charge works (test mode)
- [ ] Success -> creates user / unlocks portal?
- [ ] Webhook fires - check Stripe dashboard

## 6. HQ PORTAL - /tarris/future (PROTECTED)
- [ ] Requires login - 307 if not logged in (CORRECT)
- [ ] After payment/sign, Tarris can log in
- [ ] Dashboard shows:
    - Merch sales?
    - Bookings?
    - Brand deals?
    - Content calendar?
- [ ] 45k lines of portal code actually render

## 7. BONFIRE LEDGER - lib/tb3/bonfire-ledger.ts
- [ ] persistTenantInstall works
- [ ] setModuleEnabled works
- [ ] Removes console.log (BUG - line 33-36)
- [ ] Webhook secret is strong (BUG - currently weak)

## 8. MERCH STORE - ??? UNKNOWN - BIGGEST GAP
- [ ] Where is store? Shopify? Printful? Fourthwall?
- [ ] URL: tb3.online/shop or external?
- [ ] Products sync?
- [ ] Checkout works?
- [ ] Orders flow to fulfillment?
- [ ] Tarris gets paid? 20% referral tracking?

## 9. EMAIL / AUTOMATIONS
- [ ] Tarris gets welcome email after sign?
- [ ] You get notification when Tarris signs?
- [ ] Payment receipt sent?
- [ ] Future content drop notifications?

## 10. DOMAIN / INFRA
- [ ] tb3.online DNS points to Vercel
- [ ] SSL cert valid
- [ ] ea-payments -> tb3.online rewrite/proxy works
- [ ] .env vars set in Vercel production
