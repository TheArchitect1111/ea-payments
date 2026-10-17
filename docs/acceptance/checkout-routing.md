# Amanda V3 final no-charge checkout and routing proof

**No charges, bookings, enrollments or notifications were generated.**

| Class / action | Link verified | Result |
|---|---|---|
| Wood Therapy, Register / Buy Now | `https://checkout.square.site/merchant/ML66P9AHCJ025/checkout/HKOOTIHYWSOICFQLLKBUD4FV` | HTTP 200, Preview shows CAD 997, transaction not submitted |
| Advanced Body Sculpt, Join Waitlist | `/courses/advanced-body-sculpt#waitlist` | HTTP 200, no submission |
| Starter Kit, Request Info | `/amanda-catherine#contact` | HTTP 200, no submission; displayed price CAD 499 |
| Jane booking | `https://aesthetikine.janeapp.com/#/discipline/1/treatment/2` | HTTP 200, no booking |
| TB3 shared client public smoke | `https://tb3.online` | HTTP 200, no authenticated operations |

Verification includes destination URLs and Playwright screenshots. This does **not** prove the Square checkout's final charge amount matches raw Airtable, nor that an authenticated fulfillment completed.

Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033958937/artifacts/12101223575 .
