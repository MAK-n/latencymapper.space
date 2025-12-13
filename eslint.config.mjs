import globals from "globals";
import { defineConfig } from "eslint/config";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  // Global ignores
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
  },

  // JS + Prettier rules
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      prettier,
    },
    rules: {
      "no-unused-vars": "off",
      "no-console": "off",
      "no-undef": "error",

      // Prettier as ESLint rule
      "prettier/prettier": "warn",
    },
  },

  // Disable ESLint formatting rules that conflict with Prettier
  prettierConfig,
]);
