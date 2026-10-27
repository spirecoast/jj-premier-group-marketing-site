// ESLint 9 flat config. `next lint` is gone in Next 16, so `npm run lint` runs
// ESLint directly with Next's own rule sets (React, hooks, a11y, Core Web Vitals,
// TypeScript). CI runs it on every pull request (.github/workflows/ci.yml).
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      // These four come from the React Compiler's analysis (eslint-plugin-react-hooks 7).
      // The site doesn't compile with it, and what they flag here is sound without it:
      // server components reading the clock once per request, counters in a server
      // render, effects that sync state from the URL or localStorage after hydration.
      // They stay visible as warnings; turn them back to errors before adopting the compiler.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  {
    // Node scripts, not React: `useProxy` there is a flag, not a hook.
    files: ["scripts/**", "neighborhood-data/scripts/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated, vendored or not code.
    "public/**",
    "sanity.types.ts",
    "supabase/functions/**",
    "data/**",
    "design/**",
    "docs/**",
  ]),
]);
