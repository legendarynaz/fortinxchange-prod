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
        // 4ortin-X brand colors
        'app-bg': '#0D1117',
        'card-bg': '#1A1A2E',
        'card-hover': '#252542',
        'accent': '#F0B90B',
        'accent-light': 'rgba(240, 185, 11, 0.1)',
        'accent-20': 'rgba(240, 185, 11, 0.2)',
        // Chain colors
        'btc': '#F7931A',
        'btc-light': 'rgba(247, 147, 26, 0.1)',
        'trx': '#FF0013',
        'trx-light': 'rgba(255, 0, 19, 0.1)',
        'eth': '#627EEA',
        'sol': '#9945FF',
      },
    },
  },
  plugins: [],
}
