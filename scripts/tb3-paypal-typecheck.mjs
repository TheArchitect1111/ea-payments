// Scoped verification: includes new routes/UI and their actual dependencies.
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((x) =>
      x.isDirectory()
        ? files(path.join(dir, x.name))
        : /\.(ts|tsx)$/.test(x.name)
          ? [path.join(dir, x.name)]
          : [],
    );
}
const roots = [
  ...files("app/api/tb3/paypal"),
  "tests/tb3-commerce-hq.test.mts",
  "tests/tb3-phase2.spec.ts",
  "lib/tb3/paypal-report.ts",
  "lib/tb3/printful-catalog-validation.ts",
  ...files("app/tarris/paypal-checkout"),
  "app/tarris/future/page.tsx",
  "tests/tb3-paypal.test.mts",
  "scripts/tb3-paypal-migration-preflight.mts",
];
const program = ts.createProgram(roots, {
  ...parsed.options,
  incremental: false,
  noEmit: true,
});
const allDiagnostics = ts.getPreEmitDiagnostics(program);
const relevantRoots = ["app/api/tb3/paypal/", "app/tarris/paypal-checkout/", "app/tarris/future/page.tsx", "app/portal/components/Tb3MerchSales.tsx", "lib/tb3/", "tests/tb3-commerce-hq.test.mts", "tests/tb3-phase2.spec.ts", "tests/tb3-paypal.test.mts", "scripts/tb3-paypal-migration-preflight.mts"];
const diagnostics = allDiagnostics.filter((diagnostic) => {
  const file = diagnostic.file ? path.relative(process.cwd(), diagnostic.file.fileName).replaceAll("\\", "/") : "";
  return relevantRoots.some((root) => file.startsWith(root));
});
process.stdout.write(
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (x) => x,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  }),
);
console.log(`PayPal/TB3 diagnostics: ${diagnostics.length}; unrelated repository dependency diagnostics: ${allDiagnostics.length - diagnostics.length}`);
process.exitCode = diagnostics.length ? 1 : 0;
