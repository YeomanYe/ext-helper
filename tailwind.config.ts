/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./popup.tsx"],
  theme: {
    extend: {
      colors: {
        punk: {
          primary: "rgb(var(--punk-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--punk-secondary-rgb) / <alpha-value>)",
          cta: "rgb(var(--punk-cta-rgb) / <alpha-value>)",
          accent: "rgb(var(--punk-accent-rgb) / <alpha-value>)",
          success: "rgb(var(--punk-success-rgb) / <alpha-value>)",
          warning: "rgb(var(--punk-warning-rgb) / <alpha-value>)",
          error: "rgb(var(--punk-error-rgb) / <alpha-value>)",
          bg: "rgb(var(--punk-bg-rgb) / <alpha-value>)",
          "bg-alt": "rgb(var(--punk-bg-alt-rgb) / <alpha-value>)",
          "surface-soft": "rgb(var(--punk-surface-soft-rgb) / <alpha-value>)",
          "surface-raised": "rgb(var(--punk-surface-raised-rgb) / <alpha-value>)",
          "surface-inset": "rgb(var(--punk-surface-inset-rgb) / <alpha-value>)",
          border: "rgb(var(--punk-border-rgb) / <alpha-value>)",
          "text-primary": "rgb(var(--punk-text-primary-rgb) / <alpha-value>)",
          "text-secondary": "rgb(var(--punk-text-secondary-rgb) / <alpha-value>)",
          "text-muted": "rgb(var(--punk-text-muted-rgb) / <alpha-value>)",
          "neon-pink": "rgb(var(--punk-neon-pink-rgb) / <alpha-value>)",
          "neon-cyan": "rgb(var(--punk-neon-cyan-rgb) / <alpha-value>)",
          "neon-yellow": "rgb(var(--punk-neon-yellow-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        "punk-heading": [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"JetBrains Mono"',
          "Menlo",
          "monospace",
        ],
        "punk-body": [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"JetBrains Mono"',
          "Menlo",
          "monospace",
        ],
        "punk-code": ['"JetBrains Mono"', "Menlo", "monospace"],
        sans: [
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"JetBrains Mono"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        "neon-primary":
          "0 0 5px rgb(var(--punk-primary-rgb) / 0.55), 0 0 20px rgb(var(--punk-primary-rgb) / 0.35), 0 0 40px rgb(var(--punk-primary-rgb) / 0.25)",
        "neon-pink":
          "0 0 5px rgb(var(--punk-neon-pink-rgb) / 0.55), 0 0 20px rgb(var(--punk-neon-pink-rgb) / 0.35), 0 0 40px rgb(var(--punk-neon-pink-rgb) / 0.25)",
        "neon-cyan":
          "0 0 5px rgb(var(--punk-neon-cyan-rgb) / 0.55), 0 0 20px rgb(var(--punk-neon-cyan-rgb) / 0.35), 0 0 40px rgb(var(--punk-neon-cyan-rgb) / 0.25)",
        "neon-cta":
          "0 0 5px rgb(var(--punk-cta-rgb) / 0.55), 0 0 20px rgb(var(--punk-cta-rgb) / 0.35), 0 0 40px rgb(var(--punk-cta-rgb) / 0.25)",
        "neon-success":
          "0 0 5px rgb(var(--punk-success-rgb) / 0.55), 0 0 20px rgb(var(--punk-success-rgb) / 0.35), 0 0 40px rgb(var(--punk-success-rgb) / 0.25)",
        "punk-hard": "var(--punk-hard-shadow)",
        "punk-panel": "var(--punk-panel-shadow)",
      },
    },
  },
  plugins: [],
}
