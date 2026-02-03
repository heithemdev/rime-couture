// apps/web/eslint.config.js
import { nextJsConfig as sharedNext } from "@repo/eslint-config/next-js";
import globals from "globals";

export default [
  ...sharedNext,

  // next.config.js runs in Node — give it Node globals like `process`
  {
    files: ["next.config.*", "postcss.config.*"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    // Turbo rule can be noisy here even when NODE_ENV is in turbo.json.
    // Disable it only for config files.
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },

  // Allow <img> tags for external images (pexels, etc.)
  // Allow 'jsx' and 'global' props on <style> for styled-jsx
  {
    files: ["**/*.tsx", "**/*.jsx"],
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unknown-property": ["error", { ignore: ["jsx", "global"] }],
    },
  },

  // Server-side email helper reads env vars at runtime.
  // Turbo env declaration linting isn't helpful here during local/dev.
  {
    files: ["lib/email/**/*.ts"],
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
