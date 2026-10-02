import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    files: [
      'tools/ea-bolt-slides/src/deck/Annotator.tsx',
      'tools/ea-bolt-slides/src/deck/Deck.tsx',
    ],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
  {
    files: [
      'app/consider/joe-smith/page.tsx',
      'app/amplifi/create/AmplifiCreateStudio.tsx',
      'app/amplifi/performance/page.tsx',
    ],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['app/api/portal/amplifi/create-campaign/route.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // These two audited utility scripts intentionally use CommonJS for Node and vm harness behavior.
  {
    files: ['scripts/production-certification.js', 'scripts/test-amanda-enrollment-preview-route.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@next/next/no-assign-module-variable': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "vendor/**",
    "extension/**",
    "test-results/**",
    "playwright-report/**",
    "mobile/metro.config.js",
    "video-factory/**",
  ]),
]);

export default eslintConfig;
