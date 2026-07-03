import fs from 'fs';
import path from 'path';

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(ent.name)) {
      let c = fs.readFileSync(p, 'utf8');
      const orig = c;
      const hasNavy = c.includes("const NAVY = '#1B2B4D'");
      const hasGoldLower = /const GOLD = '#c9a844'/i.test(c);
      if (!hasNavy && !hasGoldLower) continue;

      c = c.replace(/const NAVY = '#1B2B4D';\r?\nconst GOLD = '#C9A844';\r?\n\r?\n?/g, '');
      c = c.replace(/const NAVY = '#1B2B4D';\r?\n\r?\n?/g, '');
      c = c.replace(/const GOLD = '#c9a844';\r?\n\r?\n?/gi, '');
      if (c === orig) continue;

      const importLine = "import { NAVY, GOLD } from '@/lib/design-system';\n";
      if (!c.includes("from '@/lib/design-system'")) {
        if (c.startsWith("'use client'")) {
          c = c.replace(/^('use client';?\r?\n\r?\n?)/, `$1${importLine}`);
        } else {
          c = importLine + c;
        }
      }
      fs.writeFileSync(p, c);
      console.log('updated', p);
    }
  }
}

walk('app/admin');
