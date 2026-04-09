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
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  prettier,
)
