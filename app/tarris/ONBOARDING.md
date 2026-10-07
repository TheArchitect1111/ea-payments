Scale to Next Alabama Athlete — 10 Min Onboard

Copy folder /app/tarris to /app/[new-slug] (e.g., /app/jalen)
Search repo for TENANT_KEY — change const TENANT="tarris" to const TENANT="new-slug" in all future pages
Replace /public/tb3/merch/ 10 PNGs with new athlete merch (keep same filenames or update TB3_PRODUCTS in data/products.ts)
Replace 16 Tarris photos with new athlete photos (keep same paths or update gallery data)
Replace contact email info@tb3fundamentals.com with new family email in: app/[new-slug]/page.tsx and app/[new-slug]/future/nil/page.tsx
Deploy — portal auto-creates analytics for new tenant via tenant ledger queries
Share public link /[new-slug] — waitlist flows to new portal /[new-slug]/future

Time: 10 min per athlete. No DB migration. Tenant-scoped.

Official TB3 Email: info@tb3fundamentals.com — locked for TB3 only.
