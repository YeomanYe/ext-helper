/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./popup.tsx"
  ],
  theme: {
    extend: {
      colors: {
        punk: {
          primary: 'rgb(var(--punk-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--punk-secondary-rgb) / <alpha-value>)',
          cta: 'rgb(var(--punk-cta-rgb) / <alpha-value>)',
          accent: 'rgb(var(--punk-accent-rgb) / <alpha-value>)',
          success: 'rgb(var(--punk-success-rgb) / <alpha-value>)',
          warning: 'rgb(var(--punk-warning-rgb) / <alpha-value>)',
          error: 'rgb(var(--punk-error-rgb) / <alpha-value>)',
          bg: 'rgb(var(--punk-bg-rgb) / <alpha-value>)',
          'bg-alt': 'rgb(var(--punk-bg-alt-rgb) / <alpha-value>)',
          'surface-soft': 'rgb(var(--punk-surface-soft-rgb) / <alpha-value>)',
          'surface-raised': 'rgb(var(--punk-surface-raised-rgb) / <alpha-value>)',
          'surface-inset': 'rgb(var(--punk-surface-inset-rgb) / <alpha-value>)',
          border: 'rgb(var(--punk-border-rgb) / <alpha-value>)',
          'text-primary': 'rgb(var(--punk-text-primary-rgb) / <alpha-value>)',
          'text-secondary': 'rgb(var(--punk-text-secondary-rgb) / <alpha-value>)',
          'text-muted': 'rgb(var(--punk-text-muted-rgb) / <alpha-value>)',
          'neon-pink': 'rgb(var(--punk-neon-pink-rgb) / <alpha-value>)',
          'neon-cyan': 'rgb(var(--punk-neon-cyan-rgb) / <alpha-value>)',
          'neon-yellow': 'rgb(var(--punk-neon-yellow-rgb) / <alpha-value>)',
        }
      },
      fontFamily: {
        'punk-heading': ['"Noto Sans SC"', '"JetBrains Mono"', 'monospace'],
        'punk-body': ['"Noto Sans SC"', '"JetBrains Mono"', 'monospace'],
        'punk-code': ['"JetBrains Mono"', 'monospace'],
        sans: ['"Noto Sans SC"', '"JetBrains Mono"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        'neon-purple':
          '0 0 5px rgb(var(--punk-primary-rgb) / 0.55), 0 0 20px rgb(var(--punk-primary-rgb) / 0.35), 0 0 40px rgb(var(--punk-primary-rgb) / 0.25)',
        'neon-pink':
          '0 0 5px rgb(var(--punk-neon-pink-rgb) / 0.55), 0 0 20px rgb(var(--punk-neon-pink-rgb) / 0.35), 0 0 40px rgb(var(--punk-neon-pink-rgb) / 0.25)',
        'neon-cyan':
          '0 0 5px rgb(var(--punk-neon-cyan-rgb) / 0.55), 0 0 20px rgb(var(--punk-neon-cyan-rgb) / 0.35), 0 0 40px rgb(var(--punk-neon-cyan-rgb) / 0.25)',
        'neon-cta':
          '0 0 5px rgb(var(--punk-cta-rgb) / 0.55), 0 0 20px rgb(var(--punk-cta-rgb) / 0.35), 0 0 40px rgb(var(--punk-cta-rgb) / 0.25)',
        'neon-success':
          '0 0 5px rgb(var(--punk-success-rgb) / 0.55), 0 0 20px rgb(var(--punk-success-rgb) / 0.35), 0 0 40px rgb(var(--punk-success-rgb) / 0.25)',
        'punk-hard': 'var(--punk-hard-shadow)',
        'punk-panel': 'var(--punk-panel-shadow)',
      },
      animation: {
        'glitch': 'glitch 0.5s infinite',
        'pulse-neon': 'pulse-neon 2s infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    }
  },
  plugins: []
}
