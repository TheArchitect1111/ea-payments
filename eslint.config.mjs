import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
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
    files: ['app/consider/joe-smith/page.tsx'],
    rules: {
      'react/no-unescaped-entities': 'off',
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
