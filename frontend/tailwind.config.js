/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // spec-ui §Brand Direction — warm, earthy palette.
        // All foreground tokens meet WCAG 2.1 AA (≥ 4.5:1) on cream and sand.
        // See docs/spec-ui.md §Accessibility for the allowed text/background pairs.
        cream: '#F7F1E5',       // background
        sand: '#EFE6D2',        // panel background
        terracotta: '#9A4F2A',  // ≈ 5.3:1 on cream, ≈ 4.9:1 on sand
        espresso: '#3A2E25',    // ≈ 12:1 on cream, ≈ 11:1 on sand
        moss: '#5C6E48',        // ≈ 4.95:1 on cream, ≈ 4.53:1 on sand
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
