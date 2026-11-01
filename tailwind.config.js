/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skyths: {
          frost: '#EBEDF1',
          silver: '#D4D8DF',
          steel: '#ACADB1',
          graphite: '#706F70',
          charcoal: '#353536',
          nearblack: '#080808',
          white: '#FFFFFF',
        },
        status: {
          success: '#16A34A',
          'success-bg': 'rgba(22, 163, 74, 0.12)',
          warning: '#D97706',
          'warning-bg': 'rgba(217, 119, 6, 0.12)',
          danger: '#DC2626',
          'danger-bg': 'rgba(220, 38, 38, 0.12)',
          info: '#4B5563',
          'info-bg': 'rgba(75, 85, 99, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glass-sm': '0 2px 8px 0 rgba(8, 8, 8, 0.04), 0 1px 2px 0 rgba(8, 8, 8, 0.02)',
        'glass-md': '0 4px 16px 0 rgba(8, 8, 8, 0.08), 0 2px 4px 0 rgba(8, 8, 8, 0.04)',
        'glass-lg': '0 8px 32px 0 rgba(8, 8, 8, 0.12), 0 4px 8px 0 rgba(8, 8, 8, 0.06)',
        'glass-xl': '0 16px 48px 0 rgba(8, 8, 8, 0.18), 0 8px 16px 0 rgba(8, 8, 8, 0.08)',
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '16px',
      }
    },
  },
  plugins: [],
}
