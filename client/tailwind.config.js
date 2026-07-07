/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Bang mau "Inferno Gaming" duoc anh xa qua CSS variables, cho phep
        // doi toan bo theme (sang/toi) chi bang cach doi gia tri variable
        // tren <html>, khong can sua class o tung component.
        ink: {
          950: 'var(--color-ink-950)',
          900: 'var(--color-ink-900)',
          800: 'var(--color-ink-800)',
          700: 'var(--color-ink-700)',
          600: 'var(--color-ink-600)',
        },
        ember: {
          DEFAULT: '#ff5722',
          50: '#fff1ec',
          100: '#ffd9c9',
          400: '#ff7a45',
          500: '#ff5722',
          600: '#e8430f',
          700: '#c2350a',
        },
        gold: {
          DEFAULT: '#f5b942',
          400: '#f7c968',
          500: '#f5b942',
          600: '#d99e2a',
        },
        mist: {
          100: 'var(--color-mist-100)',
          300: 'var(--color-mist-300)',
          400: 'var(--color-mist-400)',
          500: 'var(--color-mist-500)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(255,87,34,0.18), transparent 60%)',
        'ember-gradient': 'linear-gradient(135deg, #ff5722 0%, #f5b942 100%)',
      },
      boxShadow: {
        ember: '0 0 24px rgba(255,87,34,0.35)',
        glow: '0 0 40px rgba(245,185,66,0.25)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
