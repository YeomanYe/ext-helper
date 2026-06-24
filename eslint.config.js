import tseslint from "typescript-eslint"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import prettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: ["dist/", "dist-web/", "build/", ".plasmo/", "node_modules/", "coverage/"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      // `no-console` is an error (not warn) so bare console.log can never slip
      // into a published build — all dev logging must go through src/utils/logger
      // (which is dev-only and silent in production). warn/error are allowed since
      // users need to see real warnings/errors. See logger.ts for rationale.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  prettier,
)
