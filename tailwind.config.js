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
          blue: '#3B6FD4',
        },
        blue: {
          50:  '#eef3fb',
          100: '#d5e2f5',
          200: '#adc5eb',
          300: '#7ea3de',
          400: '#5582d3',
          500: '#3B6FD4',
          600: '#2f5bb8',
          700: '#254a99',
          800: '#1c3a7a',
          900: '#132a5c',
          950: '#0b1a3d',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '800px',
          },
        },
      },
    },
  },
  plugins: [],
}
