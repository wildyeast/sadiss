/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    colors: {
      'primary': '#3e5b53',
      'white': '#faf1f1',
      'modal': 'rgba(0, 0, 0, 0.4)'
    },
  },
  plugins: [],
}
