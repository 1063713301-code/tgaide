/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10B981',
          'green-dark': '#059669',
          blue: '#5288df',
        },
        // 覆盖 gray 色板为冷灰色系（slate 风格）
        gray: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // 覆盖 blue 色板（饱和度降低25%）
        blue: {
          50:  '#f1f6fd',
          100: '#dfebfa',
          200: '#c7dcf6',
          300: '#a0c5f0',
          400: '#73a7e7',
          500: '#5288df',
          600: '#3e6dd2',
          700: '#345ac1',
          800: '#30499d',
          900: '#2b417d',
          950: '#1f294c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', 'sans-serif'],
      },
      borderRadius: {
        xl:  '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.04)',
        'card-hover': '0 12px 32px rgba(0,0,0,0.08)',
      },
      typography: {
        DEFAULT: {
          css: { maxWidth: '800px' },
        },
      },
    },
  },
  plugins: [],
}
