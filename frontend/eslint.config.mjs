
import eslintPluginNext from "@next/eslint-plugin-next";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginStorybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

import * as fs from "fs";

const eslintIgnore = [
  ".git/",
  ".next/",
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  "artifacts/",
  "playwright-report/",
  "test-results/",
  // Tooling/generated files outside the typed application project.
  "codemods/",
  "jest.polyfills.js",
  "jest.setup.js",
  "report-bundle-size.js",
  "*.min.js",
  "*.config.js",
  "*.d.ts",
];

const config = tseslint.config(
  // ➊ baseline
  { ignores: eslintIgnore },

  // ➋ add Storybook rules
  ...eslintPluginStorybook.configs["flat/recommended"],

  // ➌ base TS rules
  ...tseslint.configs.recommended,

  // ➍ import-plugin recommended (flat)
  eslintPluginImport.flatConfigs.recommended,

  // ➎ Type-aware parsing only for TypeScript sources that belong to tsconfig.
  // Repository JS tooling (Jest setup, codemods, bundle scripts) stays lintable
  // without being forced through parserOptions.project.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: ["./tsconfig.json"],
      },
    },
  },

  // ➏ Next.js + React plugins + project rules
  {
    plugins: {
      "@next/next": eslintPluginNext,
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },

    settings: {
      react: {
        version: "detect",
      },

      tailwindcss: {
        callees: ["classnames", "clsx", "ctl", "cn", "cva"],
      },

      "import/resolver": {
        // make eslint-plugin-import understand TS aliases
        typescript: {
          project: ["./tsconfig.json"],
          alwaysTryTypes: true,
        },
        node: {
          moduleDirectory: ["node_modules", "./"],
        },
      },
    },

    rules: {
      // ----- Next.js defaults -----
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs["core-web-vitals"].rules,

      // ----- TS overrides -----
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // relax this so build passes even with `any`
      "@typescript-eslint/no-explicit-any": "warn",

      // ----- import sort / order -----
      // if you want these to fail build, change 'warn' -> 'error'
      "sort-imports": [
        "warn",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          // keep member sort strict so `import { A, B }` is alphabetic
          ignoreMemberSort: false,
        },
      ],

      "import/order": [
        "warn",
        {
          groups: ["external", "builtin", "internal", "sibling", "parent", "index"],
          pathGroups: [
            ...getDirectoriesToSort().map((d) => ({
              pattern: `${d}/**`,
              group: "internal",
            })),
            { pattern: "env", group: "internal" },
            { pattern: "theme", group: "internal" },
            { pattern: "public/**", group: "internal", position: "after" },
          ],
          pathGroupsExcludedImportTypes: ["internal"],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
    },
  },
);

/* -------- helper ------------------------------------------------ */
function getDirectoriesToSort() {
  const ignored = [".git", ".next", ".vscode", "node_modules"];
  return fs
    .readdirSync(process.cwd())
    .filter((f) => fs.statSync(`${process.cwd()}/${f}`).isDirectory())
    .filter((f) => !ignored.includes(f));
}

export default config;
