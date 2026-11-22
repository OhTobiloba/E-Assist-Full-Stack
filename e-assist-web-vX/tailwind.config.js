/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14171F',
        navy: { DEFAULT: '#242B47', light: '#3A4470' },
        amber: { DEFAULT: '#E1A339', dark: '#B87F22', bg: '#FBEEDA' },
        paper: '#F1EFEA',
        line: '#E2DFD6',
        muted: '#6B6A63',
        ok: { DEFAULT: '#2E7D5B', bg: '#E4EFE8' },
        bad: { DEFAULT: '#C1483D', bg: '#F7E7E4' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
