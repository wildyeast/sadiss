/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3e5b53',
        secondary: '#253833',
        highlight: '#79ea04',
        danger: '#ff3d00'
      }
    }
  },
  plugins: []
}
