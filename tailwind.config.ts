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
          primary: '#7C3AED',      // Neon Purple
          secondary: '#A78BFA',    // Light Purple
          cta: '#F43F5E',         // Rose Red
          accent: '#22D3EE',       // Cyan
          success: '#10B981',       // Neon Green
          warning: '#FBBF24',      // Amber
          error: '#F43F5E',        // Rose
          bg: '#0F0F23',           // Deep Dark Blue
          'bg-alt': '#1A1A2E',     // Slightly lighter dark
          border: '#7C3AED',       // Purple border (glowing)
          'text-primary': '#E2E8F0', // Light text
          'text-secondary': '#94A3B8', // Muted text
          'text-muted': '#64748B', // Very muted
          'neon-pink': '#FF00FF',  // Magenta
          'neon-cyan': '#00FFFF',   // Cyan
          'neon-yellow': '#FFFF00', // Yellow
        }
      },
      fontFamily: {
        'punk-heading': ['"Noto Sans SC"', '"JetBrains Mono"', 'monospace'],
        'punk-body': ['"Noto Sans SC"', '"JetBrains Mono"', 'monospace'],
        'punk-code': ['"JetBrains Mono"', 'monospace'],
        sans: ['"Noto Sans SC"', '"JetBrains Mono"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        'neon-purple': '0 0 5px #7C3AED, 0 0 20px #7C3AED, 0 0 40px #7C3AED',
        'neon-pink': '0 0 5px #FF00FF, 0 0 20px #FF00FF, 0 0 40px #FF00FF',
        'neon-cyan': '0 0 5px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF',
        'neon-cta': '0 0 5px #F43F5E, 0 0 20px #F43F5E, 0 0 40px #F43F5E',
        'neon-success': '0 0 5px #10B981, 0 0 20px #10B981, 0 0 40px #10B981',
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
