import fs from 'node:fs';

const lines = fs.readFileSync('.env.production.pull', 'utf8').split(/\r?\n/);
const a = lines.find((l) => l.startsWith('ADMIN_SESSION_SECRET'));
const s = lines.find((l) => l.startsWith('SESSION_SECRET'));
function info(line) {
  if (!line) return { found: false };
  const i = line.indexOf('=');
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return { found: true, valueLen: v.length, empty: !v };
}
console.log(JSON.stringify({ admin: info(a), session: info(s), totalLines: lines.length }));
