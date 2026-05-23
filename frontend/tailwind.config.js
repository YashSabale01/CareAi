/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0f1e', secondary: '#111827', card: '#1a2234', elevated: '#1f2d3d' },
        accent: { primary: '#00d4ff', secondary: '#6366f1' },
        risk: { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' },
        border: '#2d3748',
      },
      fontFamily: { display: ['DM Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
};
