/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00B96B',
          50: '#e5f8f0',
          100: '#ccf1e1',
          200: '#99e3c4',
          300: '#66d5a6',
          400: '#33c789',
          500: '#00b96b',
          600: '#009456',
          700: '#006f40',
          800: '#004a2b',
          900: '#002515',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f4f4f5',
          muted: '#e4e4e7',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"PingFang SC"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
