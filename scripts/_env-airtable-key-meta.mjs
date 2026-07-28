import fs from 'node:fs';
const t = fs.readFileSync('.env.local', 'utf8');
for (const line of t.split(/\r?\n/)) {
  const m = line.match(/^(AIRTABLE_API_KEY|AIRTABLE_PAT)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  console.log(
    JSON.stringify({
      name: m[1],
      present: Boolean(v),
      length: v.length,
      prefix: v.slice(0, 3),
    }),
  );
}
