import fs from 'node:fs';

const middleware = fs.readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8');
const visualSpec = fs.readFileSync(
  new URL('../tests/ece-visual/viewport-integrity.spec.ts', import.meta.url),
  'utf8',
);

const failures = [];
const check = (value, label) => {
  if (!value) failures.push(label);
};

check(
  middleware.includes("'/portal/tb3-run12b'")
    && middleware.includes("process.env.VERCEL_ENV === 'preview'"),
  'Run 12B portal bypass is restricted to Vercel Preview',
);
check(
  !middleware.includes("process.env.VERCEL_ENV === 'production' && PREVIEW_FACTORY_ACCEPTANCE_PATHS"),
  'production is never included in the factory acceptance bypass',
);
check(
  visualSpec.includes("previewPath === '/portal/tb3-run12b'")
    && visualSpec.includes("toHaveURL(/\\/portal\\/tb3-run12b"),
  'ECE fails when the portal falls back to login',
);

if (failures.length) {
  console.error('FAIL', failures);
  process.exit(1);
}

console.log('PASS Run 12B Preview-only portal authentication guard');
