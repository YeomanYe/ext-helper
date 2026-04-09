export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "docs", "test", "chore", "perf", "ci", "revert"],
    ],
    "subject-case": [0], // allow Chinese/mixed case subjects
    "header-max-length": [2, "always", 100],
  },
}
