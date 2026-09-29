/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        shield: {
          dark: '#0a0d14',
          darker: '#06080d',
          card: '#111622',
          cardBorder: '#1e2638',
          hover: '#192233',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          neonPurple: '#8b5cf6',
          danger: '#ef4444',
          dangerBg: 'rgba(239, 68, 68, 0.12)',
          warning: '#f59e0b',
          warningBg: 'rgba(245, 158, 11, 0.12)',
          success: '#10b981',
          successBg: 'rgba(16, 185, 129, 0.12)',
          info: '#3b82f6',
          reported: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
