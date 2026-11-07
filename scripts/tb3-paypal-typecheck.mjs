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
  ...files("app/tarris/paypal-checkout"),
  "tests/tb3-paypal.test.mts",
  "scripts/tb3-paypal-migration-preflight.mts",
  "next-env.d.ts",
];
const program = ts.createProgram(roots, {
  ...parsed.options,
  incremental: false,
  noEmit: true,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
process.stdout.write(
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (x) => x,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  }),
);
console.log("PayPal dependency diagnostics: " + diagnostics.length);
process.exitCode = diagnostics.length ? 1 : 0;
