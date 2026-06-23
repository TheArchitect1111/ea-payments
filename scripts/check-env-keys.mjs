import fs from 'fs';
const keys = ['AIRTABLE_API_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'MAKE_ONBOARDING_WEBHOOK_URL'];
const text = fs.readFileSync('.env.vercel.production', 'utf8');
for (const line of text.split(/\r?\n/)) {
  for (const key of keys) {
    if (line.startsWith(`${key}=`)) {
      const v = line.slice(key.length + 1).replace(/^"|"$/g, '');
      console.log(`${key}: ${v.length > 10 ? `SET len=${v.length}` : v.length ? 'SHORT' : 'EMPTY'}`);
    }
  }
}
