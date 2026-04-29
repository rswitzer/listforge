/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // spec-ui §Brand Direction — warm, earthy palette.
        cream: '#F7F1E5',
        sand: '#EFE6D2',
        terracotta: '#B5683C',
        espresso: '#3A2E25',
        moss: '#7A8C5C',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
